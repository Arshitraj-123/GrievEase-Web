import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { pool } from '../../database/db';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { computeSlaDueAt, WorkingHoursDay } from '../grievances/sla-calculator';

export interface EscalationJobData {
  grievanceId: string;
  societyId: string;
  level: number;
  type: 'WARNING' | 'BREACH';
}

@Injectable()
export class EscalationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EscalationService.name);
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private sweepTimer: NodeJS.Timeout | null = null;
  private lastSweepTime: Date | null = null;
  private lastSweepErrors: number = 0;
  private isSweepRunning: boolean = false;

  constructor(
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    private gateway: NotificationsGateway
  ) {}

  async onModuleInit() {
    this.initQueueAndWorker();
    this.startHourlySweep();
  }

  async onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    if (this.worker) await this.worker.close();
    if (this.queue) await this.queue.close();
  }

  private getRedisConnection(): IORedis | null {
    try {
      const host = process.env.REDIS_HOST || 'localhost';
      const port = Number(process.env.REDIS_PORT || 6379);
      const password = process.env.REDIS_PASSWORD || 'local_redis_secret_replace_in_prod';
      return new IORedis({
        host,
        port,
        password,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times) => Math.min(times * 100, 3000),
      });
    } catch (err: any) {
      this.logger.warn(`Redis connection initialization skipped: ${err.message}`);
      return null;
    }
  }

  private initQueueAndWorker() {
    const redis = this.getRedisConnection();
    if (!redis) return;

    try {
      this.queue = new Queue('grievance-escalations', { connection: redis });
      const workerRedis = this.getRedisConnection();
      if (!workerRedis) return;

      this.worker = new Worker(
        'grievance-escalations',
        async (job: Job<EscalationJobData>) => {
          await this.processJob(job.data);
        },
        { connection: workerRedis, concurrency: 5 }
      );

      this.worker.on('failed', (job, err) => {
        this.logger.error(`Job ${job?.id} failed: ${err.message}`);
      });

      this.logger.log('🚀 Escalation BullMQ queue and worker initialized.');
    } catch (err: any) {
      this.logger.warn(`BullMQ worker initialization bypassed (falling back to hourly sweep): ${err.message}`);
    }
  }

  /**
   * Schedules delayed warning and breach jobs for a grievance at its current level
   */
  async scheduleEscalationJobs(
    grievanceId: string,
    societyId: string,
    level: number,
    dueAt: Date,
    warnBeforeHours: number = 12
  ) {
    if (!this.queue) {
      // In standalone or test mode without BullMQ, the hourly sweep handles breaches
      return;
    }

    const now = Date.now();
    const dueTime = dueAt.getTime();
    const warnTime = dueTime - warnBeforeHours * 60 * 60 * 1000;

    // 1. Warning Job
    const warnDelay = Math.max(0, warnTime - now);
    await this.queue.add(
      'escalation-warning',
      { grievanceId, societyId, level, type: 'WARNING' },
      {
        jobId: `grievance:${grievanceId}:level:${level}:warning`,
        delay: warnDelay,
        removeOnComplete: true,
      }
    );

    // 2. Breach Job
    const breachDelay = Math.max(0, dueTime - now);
    await this.queue.add(
      'escalation-breach',
      { grievanceId, societyId, level, type: 'BREACH' },
      {
        jobId: `grievance:${grievanceId}:level:${level}:breach`,
        delay: breachDelay,
        removeOnComplete: true,
      }
    );
  }

  private async processJob(data: EscalationJobData) {
    if (data.type === 'WARNING') {
      await this.handleWarning(data);
    } else if (data.type === 'BREACH') {
      await this.handleBreach(data.grievanceId, 'AUTO_SLA');
    }
  }

  private async handleWarning(data: EscalationJobData) {
    const res = await pool.query(
      `SELECT id, public_id, title, status, current_level, assigned_to, society_id
       FROM grievance WHERE id = $1;`,
      [data.grievanceId]
    );
    if (res.rows.length === 0) return;
    const g = res.rows[0];

    // Only notify if grievance is still active at the target level
    if (['RESOLVED', 'CLOSED', 'DRAFT'].includes(g.status) || g.current_level !== data.level) {
      return;
    }

    if (g.assigned_to) {
      await this.notificationsService.send({
        societyId: g.society_id,
        userId: g.assigned_to,
        title: `⚠️ SLA Warning: ${g.public_id}`,
        message: `Grievance "${g.title}" is approaching SLA breach deadline. Please take action immediately.`,
        type: 'WARNING',
        link: `/admin/grievances/${g.id}`,
      });
    }
  }

  /**
   * Atomic Breach Handler: Executes in ONE transaction with FOR UPDATE lock
   */
  async handleBreach(
    grievanceId: string,
    reason: 'AUTO_SLA' | 'MANUAL' | 'LEAVE' | 'VACANT' | 'EMERGENCY' | 'APPEAL',
    actorId?: string
  ): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      // Set super_admin bypass for the escalation worker transaction
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // 1. Lock grievance FOR UPDATE to guarantee single escalation
      const gRes = await client.query(
        `SELECT * FROM grievance WHERE id = $1 FOR UPDATE;`,
        [grievanceId]
      );
      if (gRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const g = gRes.rows[0];

      // If already resolved or closed, exit quietly
      if (['RESOLVED', 'CLOSED', 'DRAFT'].includes(g.status)) {
        await client.query('ROLLBACK');
        return false;
      }

      const currentLevel = g.current_level;

      // Stop at Level 4: No further auto-escalation; mark as FINAL_LEVEL_OVERDUE
      if (currentLevel >= 4) {
        await client.query(
          `UPDATE grievance SET flagged = true, flag_reason = 'FINAL_LEVEL_OVERDUE', updated_at = NOW() WHERE id = $1;`,
          [grievanceId]
        );
        await client.query('COMMIT');
        return false;
      }

      // 2. Cascade through next levels, finding an active primary person not on leave
      let targetLevel = currentLevel + 1;
      let assignedUser: any = null;
      let effectiveReason = reason;

      while (targetLevel <= 4 && !assignedUser) {
        // Find primary assignment for targetLevel
        const assignRes = await client.query(
          `SELECT ga.user_id, u.full_name, u.role
           FROM governance_assignment ga
           JOIN app_user u ON ga.user_id = u.id
           WHERE ga.society_id = $1 AND ga.level = $2
             AND (ga.active_to IS NULL OR ga.active_to > NOW())
           ORDER BY ga.is_primary DESC
           LIMIT 1;`,
          [g.society_id, targetLevel]
        );

        if (assignRes.rows.length === 0) {
          // Vacant level: cascade to next
          this.logger.warn(`Level ${targetLevel} is vacant in society ${g.society_id}. Cascading.`);
          effectiveReason = 'VACANT';
          targetLevel++;
          continue;
        }

        const candidateUserId = assignRes.rows[0].user_id;

        // Check if candidate is on leave
        const leaveRes = await client.query(
          `SELECT id FROM resolver_leave
           WHERE user_id = $1 AND NOW() BETWEEN from_at AND to_at;`,
          [candidateUserId]
        );

        if (leaveRes.rows.length > 0) {
          // Candidate on leave: cascade to next
          this.logger.warn(`Primary resolver for level ${targetLevel} is on leave. Cascading.`);
          effectiveReason = 'LEAVE';
          targetLevel++;
          continue;
        }

        // Found valid resolver
        assignedUser = assignRes.rows[0];
      }

      // If even Level 4 was vacant or on leave, cap at 4 with null assignee
      if (targetLevel > 4) {
        targetLevel = 4;
      }

      // 3. Compute new SLA due date for targetLevel
      const slaRes = await client.query(
        `SELECT hours FROM sla_config
         WHERE society_id = $1 AND priority = $2 AND level = $3;`,
        [g.society_id, g.priority, targetLevel]
      );
      const levelHours = Number(slaRes.rows[0]?.hours || 48);

      const whRes = await client.query(
        `SELECT weekday, start_time as "startTime", end_time as "endTime", enabled
         FROM working_hours WHERE society_id = $1;`,
        [g.society_id]
      );
      const workingHours: WorkingHoursDay[] = whRes.rows;

      const newSlaDueAt = computeSlaDueAt(new Date(), levelHours, workingHours);

      // 4. Update grievance record
      await client.query(
        `UPDATE grievance
         SET current_level = $1, assigned_to = $2, sla_due_at = $3,
             level_entered_at = NOW(), status = 'ESCALATED', updated_at = NOW()
         WHERE id = $4;`,
        [targetLevel, assignedUser?.user_id || null, newSlaDueAt, grievanceId]
      );

      // 5. Next sequence for grievance_event
      const seqRes = await client.query(
        `SELECT COALESCE(MAX(seq), 0) + 1 as next_seq FROM grievance_event WHERE grievance_id = $1;`,
        [grievanceId]
      );
      const nextSeq = Number(seqRes.rows[0].next_seq);

      // 6. Insert grievance_event
      await client.query(
        `INSERT INTO grievance_event (
          society_id, grievance_id, seq, type, actor_id, actor_role, visibility, payload
        ) VALUES ($1, $2, $3, 'ESCALATED', $4, 'SYSTEM', 'RESIDENT', $5);`,
        [
          g.society_id,
          grievanceId,
          nextSeq,
          actorId || null,
          JSON.stringify({
            fromLevel: currentLevel,
            toLevel: targetLevel,
            reason: effectiveReason,
            assignedToName: assignedUser?.full_name || 'Level Committee',
            newDueAt: newSlaDueAt.toISOString(),
          }),
        ]
      );

      // 7. Insert escalation_log
      await client.query(
        `INSERT INTO escalation_log (
          society_id, grievance_id, from_level, to_level, reason, actor_id
        ) VALUES ($1, $2, $3, $4, $5, $6);`,
        [g.society_id, grievanceId, currentLevel, targetLevel, effectiveReason, actorId || null]
      );

      // 8. Append to cryptographic audit_log
      await this.auditService.append({
        societyId: g.society_id,
        actorId: actorId || null,
        actorRole: 'SYSTEM',
        action: 'GRIEVANCE_ESCALATED',
        entityType: 'grievance',
        entityId: grievanceId,
        before: { level: currentLevel, status: g.status, assignedTo: g.assigned_to },
        after: { level: targetLevel, status: 'ESCALATED', assignedTo: assignedUser?.user_id, reason: effectiveReason },
      });

      await client.query('COMMIT');

      // 9. Dispatch notifications (outside transaction)
      // a. Notify submitter (if not anonymous, or anonymous channel)
      if (g.submitter_user_id) {
        await this.notificationsService.send({
          societyId: g.society_id,
          userId: g.submitter_user_id,
          title: `Grievance Escalated: ${g.public_id}`,
          message: `Your grievance has escalated to Level ${targetLevel} for prompt resolution.`,
          type: 'INFO',
          link: `/app/grievances/${grievanceId}`,
        });
      }

      // b. Notify previous resolver
      if (g.assigned_to) {
        await this.notificationsService.send({
          societyId: g.society_id,
          userId: g.assigned_to,
          title: `Handed Off: ${g.public_id}`,
          message: `Grievance has escalated past your deadline and ascended to Level ${targetLevel}.`,
          type: 'WARNING',
          link: `/admin/grievances/${grievanceId}`,
        });
      }

      // c. Notify new resolver
      if (assignedUser?.user_id) {
        await this.notificationsService.send({
          societyId: g.society_id,
          userId: assignedUser.user_id,
          title: `Action Required: Escalated Grievance ${g.public_id}`,
          message: `Grievance "${g.title}" escalated to Level ${targetLevel}. You are assigned as primary resolver.`,
          type: 'ALERT',
          link: `/admin/grievances/${grievanceId}`,
        });
      }

      // d. Real-time Socket.io emission
      this.gateway.emitToGrievance(grievanceId, 'grievance.escalated', {
        id: grievanceId,
        publicId: g.public_id,
        level: targetLevel,
        status: 'ESCALATED',
        slaDueAt: newSlaDueAt.toISOString(),
      });

      // Schedule next jobs for the new level
      await this.scheduleEscalationJobs(grievanceId, g.society_id, targetLevel, newSlaDueAt);

      return true;
    } catch (err: any) {
      await client.query('ROLLBACK');
      this.logger.error(`Breach handling failed for ${grievanceId}: ${err.message}`);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Hourly recovery sweep: Guarantees escalation even if Redis was flushed or server restarted
   */
  startHourlySweep() {
    const intervalMs = Number(process.env.ESCALATION_SWEEP_INTERVAL_MS || 3600000); // 1 hour
    this.sweepTimer = setInterval(() => {
      this.runHourlySweep().catch((err) => {
        this.logger.error(`Error in periodic hourly sweep: ${err.message}`);
      });
    }, intervalMs);

    this.logger.log(`⏰ Hourly escalation recovery sweep registered (interval: ${intervalMs} ms).`);
  }

  async runHourlySweep(): Promise<{ processed: number; errors: number }> {
    if (this.isSweepRunning) return { processed: 0, errors: 0 };
    this.isSweepRunning = true;
    const startTime = new Date();
    let processed = 0;
    let errors = 0;

    try {
      this.logger.log('🔍 Executing escalation recovery sweep for overdue grievances...');

      const res = await pool.query(`
        SELECT id, public_id, current_level, sla_due_at, society_id
        FROM grievance
        WHERE status NOT IN ('RESOLVED', 'CLOSED', 'DRAFT')
          AND sla_due_at <= NOW()
          AND current_level < 4
        ORDER BY sla_due_at ASC
        LIMIT 100;
      `);

      for (const row of res.rows) {
        try {
          const escalated = await this.handleBreach(row.id, 'AUTO_SLA');
          if (escalated) processed++;
        } catch (err: any) {
          errors++;
          this.logger.error(`Sweep escalation failed for ${row.public_id}: ${err.message}`);
        }
      }

      this.lastSweepTime = new Date();
      this.lastSweepErrors = errors;

      // Record job run in database
      await pool.query(
        `INSERT INTO job_run (name, started_at, finished_at, processed, errors, details)
         VALUES ('ESCALATION_SWEEP', $1, NOW(), $2, $3, $4);`,
        [startTime, processed, errors, JSON.stringify({ overdueFound: res.rows.length })]
      );

      this.logger.log(`✅ Hourly sweep completed. Processed: ${processed}, Errors: ${errors}.`);
      return { processed, errors };
    } finally {
      this.isSweepRunning = false;
    }
  }

  /**
   * Monitor metrics for /admin/escalation dashboard
   */
  async getEscalationMonitorStats(societyId: string) {
    const queueDepth = this.queue ? await this.queue.count() : 0;
    const failedJobs = this.queue ? (await this.queue.getFailed()).length : 0;

    // Upcoming breaches in next 24 hours
    const upcomingRes = await pool.query(
      `SELECT g.id, g.public_id, g.title, g.priority, g.current_level, g.sla_due_at,
              u.full_name as assigned_to_name
       FROM grievance g
       LEFT JOIN app_user u ON g.assigned_to = u.id
       WHERE g.society_id = $1
         AND g.status NOT IN ('RESOLVED', 'CLOSED', 'DRAFT')
         AND g.sla_due_at > NOW()
         AND g.sla_due_at <= NOW() + INTERVAL '24 HOURS'
       ORDER BY g.sla_due_at ASC;`,
      [societyId]
    );

    // Recent escalations
    const recentRes = await pool.query(
      `SELECT el.*, g.public_id, g.title
       FROM escalation_log el
       JOIN grievance g ON el.grievance_id = g.id
       WHERE el.society_id = $1
       ORDER BY el.created_at DESC
       LIMIT 10;`,
      [societyId]
    );

    // Check if sweep has not run for two intervals (2 hours = 7200000 ms)
    const intervalMs = Number(process.env.ESCALATION_SWEEP_INTERVAL_MS || 3600000);
    const sweepOverdue = this.lastSweepTime
      ? Date.now() - this.lastSweepTime.getTime() > intervalMs * 2
      : false;

    return {
      queueDepth,
      failedJobs,
      lastSweepTime: this.lastSweepTime ? this.lastSweepTime.toISOString() : null,
      lastSweepErrors: this.lastSweepErrors,
      sweepOverdue,
      upcomingBreaches: upcomingRes.rows,
      recentEscalations: recentRes.rows,
    };
  }
}
