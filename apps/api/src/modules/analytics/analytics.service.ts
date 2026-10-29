import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { pool } from '../../database/db';
import { MetricsService, WorkingDayConfig } from './metrics.service';
import { ReportExporterService } from './report-exporter.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AuditService } from '../audit/audit.service';
import {
  AnalyticsRange,
  AnalyticsFilterDto,
  PublicDashboardStatsDto,
  LandingStatsDto,
  ResidentAnalyticsDto,
  AdminAnalyticsDto,
  ResolverSummaryDto,
  ResolverDetailDto,
  SlaBreachReportDto,
  ReportType,
  ReportFormat,
  AnalyticsSettingsDto,
} from '@grievease/contracts';

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsService.name);
  private debounceMap = new Map<string, NodeJS.Timeout>();
  private nightlyTimer: NodeJS.Timeout | null = null;

  constructor(
    private metricsService: MetricsService,
    private reportExporterService: ReportExporterService,
    private gateway: NotificationsGateway,
    private auditService: AuditService
  ) {}

  onModuleInit() {
    this.startNightlyScheduler();
  }

  onModuleDestroy() {
    for (const timer of this.debounceMap.values()) {
      clearTimeout(timer);
    }
    this.debounceMap.clear();
    if (this.nightlyTimer) {
      clearInterval(this.nightlyTimer);
    }
  }

  /**
   * Nightly cron-like runner: Rebuilds last 35 days every 24 hours.
   */
  private startNightlyScheduler() {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    this.nightlyTimer = setInterval(async () => {
      try {
        this.logger.log('[ANALYTICS] Running scheduled nightly 35-day aggregate rebuild...');
        const societiesRes = await pool.query('SELECT id FROM society');
        for (const row of societiesRes.rows) {
          await this.rebuildSocietyAggregates(row.id, undefined, undefined, 'analytics:nightly-35d');
        }
      } catch (err: any) {
        this.logger.error(`[ANALYTICS] Scheduled nightly rebuild error: ${err.message}`);
      }
    }, TWENTY_FOUR_HOURS);
  }

  /**
   * Schedule debounced aggregate refresh on grievance events (at most once per 30s per society).
   */
  scheduleDebouncedRefresh(societyId: string) {
    if (this.debounceMap.has(societyId)) {
      return; // Already debounced and pending
    }

    const timer = setTimeout(async () => {
      this.debounceMap.delete(societyId);
      try {
        this.logger.log(`[ANALYTICS] Executing debounced refresh for society ${societyId}...`);
        await this.rebuildSocietyAggregates(societyId, undefined, undefined, 'analytics:debounced-refresh');
        this.gateway.emitStatsTick(societyId);
      } catch (err: any) {
        this.logger.error(`[ANALYTICS] Debounced refresh failed for society ${societyId}: ${err.message}`);
      }
    }, 30000); // 30 seconds debounce

    this.debounceMap.set(societyId, timer);
  }

  /**
   * Rebuild Pre-Aggregation Tables Idempotently.
   * Records execution in job_run.
   */
  async rebuildSocietyAggregates(
    societyId: string,
    fromDateStr?: string,
    toDateStr?: string,
    jobName: string = 'analytics:rebuild'
  ): Promise<{ processed: number; errors: number }> {
    const startTime = new Date();
    let processed = 0;
    let errors = 0;

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // 1. Fetch society timezone
      const socRes = await client.query('SELECT timezone FROM society WHERE id = $1', [societyId]);
      const timezone = socRes.rows[0]?.timezone || 'Asia/Kolkata';

      // 2. Determine date bounds (default last 35 days)
      const now = new Date();
      const defaultFrom = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
      const fromDate = fromDateStr || this.metricsService.toTimezoneDateString(defaultFrom, timezone);
      const toDate = toDateStr || this.metricsService.toTimezoneDateString(now, timezone);

      // 3. Fetch working hours for society
      const whRes = await client.query(
        'SELECT weekday, start_time as "startTime", end_time as "endTime", enabled FROM working_hours WHERE society_id = $1',
        [societyId]
      );
      const workingHours: WorkingDayConfig[] = whRes.rows;

      // 4. Fetch resolver leave records for breach exclusion
      const leaveRes = await client.query(
        'SELECT user_id, from_at, to_at FROM resolver_leave WHERE society_id = $1',
        [societyId]
      );
      const resolverLeaves = leaveRes.rows;

      // 5. Gather grievances within interval
      const grievancesRes = await client.query(
        `SELECT g.*, f.wing_id
         FROM grievance g
         LEFT JOIN flat f ON g.flat_id = f.id
         WHERE g.society_id = $1
           AND g.status != 'DRAFT'
           AND (g.created_at >= $2::date - interval '1 day' OR g.updated_at >= $2::date - interval '1 day')`,
        [societyId, fromDate]
      );
      const grievances = grievancesRes.rows;

      // 6. Gather grievance events
      const eventsRes = await client.query(
        `SELECT ge.*
         FROM grievance_event ge
         JOIN grievance g ON ge.grievance_id = g.id
         WHERE g.society_id = $1 AND ge.created_at >= $2::date - interval '1 day'`,
        [societyId, fromDate]
      );
      const events = eventsRes.rows;

      // 7. Gather ratings
      const ratingsRes = await client.query(
        `SELECT r.*, g.category_id
         FROM rating r
         JOIN grievance g ON r.grievance_id = g.id
         WHERE r.society_id = $1 AND r.created_at >= $2::date - interval '1 day'`,
        [societyId, fromDate]
      );
      const ratings = ratingsRes.rows;

      // 8. Gather auto-escalation logs
      const breachesRes = await client.query(
        `SELECT el.*, g.category_id
         FROM escalation_log el
         JOIN grievance g ON el.grievance_id = g.id
         WHERE g.society_id = $1 AND el.created_at >= $2::date - interval '1 day'`,
        [societyId, fromDate]
      );
      const breaches = breachesRes.rows;

      // Group events by grievance
      const eventsByGrievance = new Map<string, any[]>();
      for (const ev of events) {
        if (!eventsByGrievance.has(ev.grievance_id)) {
          eventsByGrievance.set(ev.grievance_id, []);
        }
        eventsByGrievance.get(ev.grievance_id)!.push(ev);
      }

      // Maps for aggregation accumulation
      // Key: `${date}:${categoryId}:${priority}:${level}`
      const dailyAggMap = new Map<string, any>();
      // Key: `${date}:${level}`
      const levelTimeMap = new Map<string, any>();
      // Key: `${date}:${userId}:${level}`
      const resolverMap = new Map<string, any>();
      // Key: `${date}:${categoryId}`
      const ratingMap = new Map<string, any>();
      // Key: `${date}:${wingId}:${categoryId}`
      const wingMap = new Map<string, any>();

      for (const g of grievances) {
        processed++;
        const createdDate = this.metricsService.toTimezoneDateString(g.created_at, timezone);
        const resolvedDate = g.resolved_at ? this.metricsService.toTimezoneDateString(g.resolved_at, timezone) : null;
        const gEvents = eventsByGrievance.get(g.id) || [];

        // Compute net resolution minutes and acknowledgement minutes
        const pendingIntervals: { start: Date; end: Date }[] = [];
        let firstAckAt: Date | null = null;
        let lastPendingStart: Date | null = null;

        for (const ev of gEvents) {
          if (!firstAckAt && (ev.event_type === 'ACKNOWLEDGED' || (ev.event_type === 'STATUS_CHANGE' && ev.metadata?.toStatus === 'ACKNOWLEDGED'))) {
            firstAckAt = new Date(ev.created_at);
          }
          if (ev.event_type === 'PENDING_INFO' || (ev.event_type === 'STATUS_CHANGE' && ev.metadata?.toStatus === 'PENDING_INFO')) {
            lastPendingStart = new Date(ev.created_at);
          }
          if (lastPendingStart && (ev.event_type === 'INFO_PROVIDED' || (ev.event_type === 'STATUS_CHANGE' && ev.metadata?.fromStatus === 'PENDING_INFO'))) {
            pendingIntervals.push({ start: lastPendingStart, end: new Date(ev.created_at) });
            lastPendingStart = null;
          }
        }

        let netResMinutes = 0;
        if (g.resolved_at) {
          netResMinutes = this.metricsService.calculateNetResolutionMinutes(
            g.created_at,
            g.resolved_at,
            pendingIntervals,
            workingHours,
            timezone
          );
        }

        let ackMinutes = 0;
        if (firstAckAt) {
          ackMinutes = this.metricsService.calculateNetResolutionMinutes(
            g.created_at,
            firstAckAt,
            [],
            workingHours,
            timezone
          );
        }

        // Aggregate 1: grievance_daily_agg
        const aggKey = `${createdDate}:${g.category_id}:${g.priority}:${g.current_level}`;
        if (!dailyAggMap.has(aggKey)) {
          dailyAggMap.set(aggKey, {
            societyId,
            date: createdDate,
            categoryId: g.category_id,
            priority: g.priority,
            level: g.current_level,
            submitted: 0,
            acknowledged: 0,
            resolved: 0,
            closed: 0,
            escalated: 0,
            reopened: 0,
            appeals: 0,
            resolutionMinutesSum: 0,
            resolutionCount: 0,
            ackMinutesSum: 0,
            ackCount: 0,
          });
        }
        const dailyEntry = dailyAggMap.get(aggKey)!;
        dailyEntry.submitted++;
        if (firstAckAt) {
          dailyEntry.acknowledged++;
          dailyEntry.ackMinutesSum += ackMinutes;
          dailyEntry.ackCount++;
        }
        if (g.status === 'RESOLVED' || g.status === 'CLOSED') {
          dailyEntry.resolved++;
          dailyEntry.resolutionMinutesSum += netResMinutes;
          dailyEntry.resolutionCount++;
        }
        if (g.status === 'CLOSED') dailyEntry.closed++;
        if (g.escalation_count > 0) dailyEntry.escalated += g.escalation_count;

        // Aggregate 2: level_time_agg
        if (g.resolved_at) {
          const lvlKey = `${resolvedDate}:${g.current_level}`;
          if (!levelTimeMap.has(lvlKey)) {
            levelTimeMap.set(lvlKey, { societyId, date: resolvedDate, level: g.current_level, minutesSum: 0, count: 0 });
          }
          const lvlEntry = levelTimeMap.get(lvlKey)!;
          lvlEntry.minutesSum += netResMinutes;
          lvlEntry.count++;
        }

        // Aggregate 3: resolver_daily_agg
        if (g.assigned_to) {
          const resKey = `${createdDate}:${g.assigned_to}:${g.current_level}`;
          if (!resolverMap.has(resKey)) {
            resolverMap.set(resKey, {
              societyId,
              date: createdDate,
              userId: g.assigned_to,
              level: g.current_level,
              assigned: 0,
              acknowledged: 0,
              resolved: 0,
              breachesWhileAssigned: 0,
              reopened: 0,
              ackMinutesSum: 0,
              resolutionMinutesSum: 0,
              ratingSum: 0,
              ratingCount: 0,
              openLoadEndOfDay: 0,
            });
          }
          const resEntry = resolverMap.get(resKey)!;
          resEntry.assigned++;
          if (firstAckAt) {
            resEntry.acknowledged++;
            resEntry.ackMinutesSum += ackMinutes;
          }
          if (g.status === 'RESOLVED' || g.status === 'CLOSED') {
            resEntry.resolved++;
            resEntry.resolutionMinutesSum += netResMinutes;
          }
          if (g.status !== 'RESOLVED' && g.status !== 'CLOSED') {
            resEntry.openLoadEndOfDay++;
          }
        }

        // Aggregate 4: wing_daily_agg (STRICT PRIVACY: NAMED GRIEVANCES ONLY)
        if (!g.is_anonymous && g.wing_id) {
          const wingKey = `${createdDate}:${g.wing_id}:${g.category_id}`;
          if (!wingMap.has(wingKey)) {
            wingMap.set(wingKey, {
              societyId,
              date: createdDate,
              wingId: g.wing_id,
              categoryId: g.category_id,
              submitted: 0,
              resolved: 0,
            });
          }
          const wingEntry = wingMap.get(wingKey)!;
          wingEntry.submitted++;
          if (g.status === 'RESOLVED' || g.status === 'CLOSED') {
            wingEntry.resolved++;
          }
        }
      }

      // Check breaches while assigned, strictly excluding days where resolver was on approved leave
      for (const b of breaches) {
        if (b.actor_id && b.reason === 'AUTO_SLA') {
          const breachDate = this.metricsService.toTimezoneDateString(b.created_at, timezone);
          const breachTime = new Date(b.created_at).getTime();

          // Check if resolver was on approved leave at breach time
          const isOnLeave = resolverLeaves.some((l) => {
            if (l.user_id !== b.actor_id) return false;
            const fromMs = new Date(l.from_at).getTime();
            const toMs = new Date(l.to_at).getTime();
            return breachTime >= fromMs && breachTime <= toMs;
          });

          if (!isOnLeave) {
            const resKey = `${breachDate}:${b.actor_id}:${b.level_from}`;
            if (resolverMap.has(resKey)) {
              resolverMap.get(resKey)!.breachesWhileAssigned++;
            }
          }
        }
      }

      // Aggregate ratings
      for (const r of ratings) {
        const ratingDate = this.metricsService.toTimezoneDateString(r.created_at, timezone);
        const rKey = `${ratingDate}:${r.category_id}`;
        if (!ratingMap.has(rKey)) {
          ratingMap.set(rKey, {
            societyId,
            date: ratingDate,
            categoryId: r.category_id,
            r1: 0, r2: 0, r3: 0, r4: 0, r5: 0,
            sum: 0, count: 0,
          });
        }
        const rEntry = ratingMap.get(rKey)!;
        const stars = Math.min(5, Math.max(1, Number(r.stars)));
        if (stars === 1) rEntry.r1++;
        else if (stars === 2) rEntry.r2++;
        else if (stars === 3) rEntry.r3++;
        else if (stars === 4) rEntry.r4++;
        else if (stars === 5) rEntry.r5++;
        rEntry.sum += stars;
        rEntry.count++;
      }

      // Idempotently commit pre-aggregations using UPSERTs
      await client.query('BEGIN');

      // 1. grievance_daily_agg
      for (const entry of dailyAggMap.values()) {
        await client.query(
          `INSERT INTO grievance_daily_agg (
            society_id, date, category_id, priority, level,
            submitted, acknowledged, resolved, closed, escalated, reopened, appeals,
            resolution_minutes_sum, resolution_count, ack_minutes_sum, ack_count, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
          ON CONFLICT (society_id, date, category_id, priority, level) DO UPDATE SET
            submitted = EXCLUDED.submitted,
            acknowledged = EXCLUDED.acknowledged,
            resolved = EXCLUDED.resolved,
            closed = EXCLUDED.closed,
            escalated = EXCLUDED.escalated,
            reopened = EXCLUDED.reopened,
            appeals = EXCLUDED.appeals,
            resolution_minutes_sum = EXCLUDED.resolution_minutes_sum,
            resolution_count = EXCLUDED.resolution_count,
            ack_minutes_sum = EXCLUDED.ack_minutes_sum,
            ack_count = EXCLUDED.ack_count,
            updated_at = NOW()`,
          [
            entry.societyId, entry.date, entry.categoryId, entry.priority, entry.level,
            entry.submitted, entry.acknowledged, entry.resolved, entry.closed, entry.escalated, entry.reopened, entry.appeals,
            entry.resolutionMinutesSum, entry.resolutionCount, entry.ackMinutesSum, entry.ackCount,
          ]
        );
      }

      // 2. level_time_agg
      for (const entry of levelTimeMap.values()) {
        await client.query(
          `INSERT INTO level_time_agg (society_id, date, level, minutes_sum, count, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (society_id, date, level) DO UPDATE SET
             minutes_sum = EXCLUDED.minutes_sum,
             count = EXCLUDED.count,
             updated_at = NOW()`,
          [entry.societyId, entry.date, entry.level, entry.minutesSum, entry.count]
        );
      }

      // 3. resolver_daily_agg
      for (const entry of resolverMap.values()) {
        await client.query(
          `INSERT INTO resolver_daily_agg (
            society_id, date, user_id, level,
            assigned, acknowledged, resolved, breaches_while_assigned, reopened,
            ack_minutes_sum, resolution_minutes_sum, rating_sum, rating_count, open_load_end_of_day, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
          ON CONFLICT (society_id, date, user_id, level) DO UPDATE SET
            assigned = EXCLUDED.assigned,
            acknowledged = EXCLUDED.acknowledged,
            resolved = EXCLUDED.resolved,
            breaches_while_assigned = EXCLUDED.breaches_while_assigned,
            reopened = EXCLUDED.reopened,
            ack_minutes_sum = EXCLUDED.ack_minutes_sum,
            resolution_minutes_sum = EXCLUDED.resolution_minutes_sum,
            open_load_end_of_day = EXCLUDED.open_load_end_of_day,
            updated_at = NOW()`,
          [
            entry.societyId, entry.date, entry.userId, entry.level,
            entry.assigned, entry.acknowledged, entry.resolved, entry.breachesWhileAssigned, entry.reopened,
            entry.ackMinutesSum, entry.resolutionMinutesSum, entry.ratingSum, entry.ratingCount, entry.openLoadEndOfDay,
          ]
        );
      }

      // 4. rating_daily_agg
      for (const entry of ratingMap.values()) {
        await client.query(
          `INSERT INTO rating_daily_agg (
            society_id, date, category_id,
            rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count,
            rating_sum, rating_count, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          ON CONFLICT (society_id, date, category_id) DO UPDATE SET
            rating_1_count = EXCLUDED.rating_1_count,
            rating_2_count = EXCLUDED.rating_2_count,
            rating_3_count = EXCLUDED.rating_3_count,
            rating_4_count = EXCLUDED.rating_4_count,
            rating_5_count = EXCLUDED.rating_5_count,
            rating_sum = EXCLUDED.rating_sum,
            rating_count = EXCLUDED.rating_count,
            updated_at = NOW()`,
          [
            entry.societyId, entry.date, entry.categoryId,
            entry.r1, entry.r2, entry.r3, entry.r4, entry.r5,
            entry.sum, entry.count,
          ]
        );
      }

      // 5. wing_daily_agg
      for (const entry of wingMap.values()) {
        await client.query(
          `INSERT INTO wing_daily_agg (society_id, date, wing_id, category_id, submitted, resolved, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (society_id, date, wing_id, category_id) DO UPDATE SET
             submitted = EXCLUDED.submitted,
             resolved = EXCLUDED.resolved,
             updated_at = NOW()`,
          [entry.societyId, entry.date, entry.wingId, entry.categoryId, entry.submitted, entry.resolved]
        );
      }

      await client.query('COMMIT');

      // Record job execution in job_run
      await client.query(
        `INSERT INTO job_run (name, started_at, finished_at, processed, errors, details)
         VALUES ($1, $2, NOW(), $3, $4, $5)`,
        [
          jobName,
          startTime,
          processed,
          errors,
          JSON.stringify({ societyId, fromDate, toDate, durationMs: Date.now() - startTime.getTime() }),
        ]
      );

      this.logger.log(`[ANALYTICS] Aggregates rebuilt successfully for society ${societyId} (${processed} processed)`);
      return { processed, errors };
    } catch (err: any) {
      await client.query('ROLLBACK');
      errors++;
      this.logger.error(`[ANALYTICS] Rebuild failed for society ${societyId}: ${err.message}`);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Helper to retrieve society settings related to analytics.
   */
  async getSocietySettings(societyId: string): Promise<{
    publicDashboardEnabled: boolean;
    publicDashboardVisibility: 'PUBLIC' | 'RESIDENTS_ONLY';
    minCellSize: number;
    perfThresholdExcellent: number;
    perfThresholdOnTrack: number;
  }> {
    const res = await pool.query(
      `SELECT key, value FROM society_setting
       WHERE society_id = $1 AND key IN (
         'public_dashboard_enabled',
         'public_dashboard_visibility',
         'min_cell_size',
         'perf_threshold_excellent',
         'perf_threshold_on_track'
       )`,
      [societyId]
    );

    const map = new Map<string, string>();
    for (const r of res.rows) {
      map.set(r.key, r.value);
    }

    return {
      publicDashboardEnabled: map.get('public_dashboard_enabled') !== 'false',
      publicDashboardVisibility: (map.get('public_dashboard_visibility') as any) || 'RESIDENTS_ONLY',
      minCellSize: parseInt(map.get('min_cell_size') || '5', 10),
      perfThresholdExcellent: parseInt(map.get('perf_threshold_excellent') || '90', 10),
      perfThresholdOnTrack: parseInt(map.get('perf_threshold_on_track') || '75', 10),
    };
  }

  /**
   * GET /public/society/:slug/dashboard
   */
  async getPublicDashboard(slug: string, range: AnalyticsRange = '30d', isAuthenticatedResident: boolean = false): Promise<PublicDashboardStatsDto> {
    const socRes = await pool.query('SELECT id, name, slug, timezone FROM society WHERE slug = $1', [slug]);
    if (socRes.rows.length === 0) {
      throw new NotFoundException(`Society with slug '${slug}' not found`);
    }
    const society = socRes.rows[0];
    const settings = await this.getSocietySettings(society.id);

    if (!settings.publicDashboardEnabled) {
      throw new NotFoundException('Public dashboard is disabled for this society');
    }

    if (settings.publicDashboardVisibility === 'RESIDENTS_ONLY' && !isAuthenticatedResident) {
      throw new ForbiddenException('Dashboard is restricted to residents only');
    }

    return this.buildDashboardPayload(society.id, society.name, society.slug, range, settings.minCellSize);
  }

  /**
   * GET /public/stats (Landing page tiny payload, 60s cache, 204 if disabled/low data)
   */
  async getLandingStats(): Promise<LandingStatsDto | null> {
    // Find first society with public dashboard enabled and PUBLIC visibility
    const res = await pool.query(`
      SELECT s.id, s.name, s.slug
      FROM society s
      JOIN society_setting ss ON s.id = ss.society_id AND ss.key = 'public_dashboard_enabled' AND ss.value = 'true'
      JOIN society_setting ss2 ON s.id = ss2.society_id AND ss2.key = 'public_dashboard_visibility' AND ss2.value = 'PUBLIC'
      LIMIT 1;
    `);

    if (res.rows.length === 0) {
      return null;
    }

    const society = res.rows[0];
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const statsRes = await pool.query(`
      SELECT
        COALESCE(SUM(resolved), 0)::int as "resolvedThisMonth",
        COALESCE(SUM(resolution_minutes_sum), 0)::bigint as "resMinutesSum",
        COALESCE(SUM(resolution_count), 0)::int as "resCount"
      FROM grievance_daily_agg
      WHERE society_id = $1 AND date >= $2::date;
    `, [society.id, startOfMonth.toISOString().slice(0, 10)]);

    const ratingRes = await pool.query(`
      SELECT
        COALESCE(SUM(rating_sum), 0)::int as "ratingSum",
        COALESCE(SUM(rating_count), 0)::int as "ratingCount"
      FROM rating_daily_agg
      WHERE society_id = $1;
    `, [society.id]);

    const resolvedThisMonth = statsRes.rows[0]?.resolvedThisMonth || 0;
    const resMinutesSum = Number(statsRes.rows[0]?.resMinutesSum || 0);
    const resCount = statsRes.rows[0]?.resCount || 0;
    const ratingSum = ratingRes.rows[0]?.ratingSum || 0;
    const ratingCount = ratingRes.rows[0]?.ratingCount || 0;

    // Minimum data requirements: at least 5 resolved items and 5 ratings
    if (resolvedThisMonth < 5 || ratingCount < 5) {
      return null;
    }

    const avgResHours = resCount > 0 ? parseFloat((resMinutesSum / resCount / 60).toFixed(1)) : 0;
    const satisfactionScore = ratingCount > 0 ? parseFloat((ratingSum / ratingCount).toFixed(1)) : 0;

    return {
      resolvedThisMonth,
      averageResolutionHours: avgResHours,
      satisfactionScore,
      ratingCount,
      societyName: society.name,
    };
  }

  /**
   * GET /app/analytics (Resident view: same as public plus SLA compliance by level)
   */
  async getResidentAnalytics(societyId: string, range: AnalyticsRange = '30d'): Promise<ResidentAnalyticsDto> {
    const socRes = await pool.query('SELECT name, slug FROM society WHERE id = $1', [societyId]);
    if (socRes.rows.length === 0) {
      throw new NotFoundException('Society not found');
    }
    const { name, slug } = socRes.rows[0];
    const settings = await this.getSocietySettings(societyId);

    const baseDashboard = await this.buildDashboardPayload(societyId, name, slug, range, settings.minCellSize);

    // Compute SLA compliance by level
    const days = range === '12m' ? 365 : range === '90d' ? 90 : 30;
    const complianceRes = await pool.query(`
      SELECT
        level,
        COALESCE(SUM(resolved), 0)::int as "resolved",
        COALESCE(SUM(escalated), 0)::int as "escalated"
      FROM grievance_daily_agg
      WHERE society_id = $1 AND date >= CURRENT_DATE - $2::int
      GROUP BY level
      ORDER BY level;
    `, [societyId, days]);

    const slaComplianceByLevel = [1, 2, 3, 4].map((lvl) => {
      const row = complianceRes.rows.find((r) => r.level === lvl);
      const resolved = row ? row.resolved : 0;
      const escalated = row ? row.escalated : 0;
      const totalHandled = resolved + escalated;
      const complianceRate = totalHandled > 0 ? Math.round((resolved / totalHandled) * 100) : 100;
      return {
        level: lvl,
        complianceRate,
        totalHandled,
      };
    });

    return {
      ...baseDashboard,
      slaComplianceByLevel,
    };
  }

  /**
   * GET /admin/analytics (SECRETARY and above)
   */
  async getAdminAnalytics(societyId: string, filters: AnalyticsFilterDto): Promise<AdminAnalyticsDto> {
    const days = filters.range === '12m' ? 365 : filters.range === '90d' ? 90 : 30;
    const settings = await this.getSocietySettings(societyId);

    // 1. Live Counters & KPIs
    const kpiRes = await pool.query(`
      SELECT
        COALESCE(SUM(submitted), 0)::int as "totalSubmitted",
        COALESCE(SUM(resolved), 0)::int as "resolvedCount",
        COALESCE(SUM(resolution_minutes_sum), 0)::bigint as "resMinutesSum",
        COALESCE(SUM(resolution_count), 0)::int as "resCount",
        COALESCE(SUM(escalated), 0)::int as "escalatedCount",
        COALESCE(SUM(appeals), 0)::int as "appealsCount",
        COALESCE(SUM(reopened), 0)::int as "reopensCount"
      FROM grievance_daily_agg
      WHERE society_id = $1 AND date >= CURRENT_DATE - $2::int;
    `, [societyId, days]);

    const liveOpenRes = await pool.query(`
      SELECT COUNT(*)::int as "openLoad"
      FROM grievance
      WHERE society_id = $1 AND status NOT IN ('RESOLVED', 'CLOSED', 'DRAFT');
    `, [societyId]);

    const ratingRes = await pool.query(`
      SELECT
        COALESCE(SUM(rating_sum), 0)::int as "ratingSum",
        COALESCE(SUM(rating_count), 0)::int as "ratingCount"
      FROM rating_daily_agg
      WHERE society_id = $1 AND date >= CURRENT_DATE - $2::int;
    `, [societyId, days]);

    const totalSubmitted = kpiRes.rows[0]?.totalSubmitted || 0;
    const resolvedCount = kpiRes.rows[0]?.resolvedCount || 0;
    const openLoad = liveOpenRes.rows[0]?.openLoad || 0;
    const resMinutesSum = Number(kpiRes.rows[0]?.resMinutesSum || 0);
    const resCount = kpiRes.rows[0]?.resCount || 0;
    const escalatedCount = kpiRes.rows[0]?.escalatedCount || 0;
    const appealsCount = kpiRes.rows[0]?.appealsCount || 0;
    const reopensCount = kpiRes.rows[0]?.reopensCount || 0;

    const avgResolutionHours = resCount > 0 ? parseFloat((resMinutesSum / resCount / 60).toFixed(1)) : 0;
    const totalHandled = resolvedCount + escalatedCount;
    const slaComplianceRate = totalHandled > 0 ? Math.round((resolvedCount / totalHandled) * 100) : 100;
    const rSum = ratingRes.rows[0]?.ratingSum || 0;
    const rCount = ratingRes.rows[0]?.ratingCount || 0;
    const satisfactionScore = rCount >= settings.minCellSize ? parseFloat((rSum / rCount).toFixed(1)) : null;

    // 2. Trend Line
    const trendRes = await pool.query(`
      SELECT
        date::text as "date",
        COALESCE(SUM(submitted), 0)::int as "submitted",
        COALESCE(SUM(resolved), 0)::int as "resolved",
        COALESCE(SUM(escalated), 0)::int as "escalated"
      FROM grievance_daily_agg
      WHERE society_id = $1 AND date >= CURRENT_DATE - $2::int
      GROUP BY date
      ORDER BY date ASC;
    `, [societyId, days]);

    // 3. Category Mix
    const catMixRes = await pool.query(`
      SELECT
        c.id as "categoryId",
        c.name_en as "categoryName",
        COALESCE(SUM(gda.submitted), 0)::int as "count"
      FROM category c
      LEFT JOIN grievance_daily_agg gda ON c.id = gda.category_id AND gda.society_id = $1 AND gda.date >= CURRENT_DATE - $2::int
      WHERE c.society_id = $1
      GROUP BY c.id, c.name_en
      ORDER BY "count" DESC;
    `, [societyId, days]);

    const categoryMix = catMixRes.rows.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      count: r.count,
      percentage: totalSubmitted > 0 ? Math.round((r.count / totalSubmitted) * 100) : 0,
    }));

    // 4. Priority Mix
    const priorityRes = await pool.query(`
      SELECT
        priority,
        COALESCE(SUM(submitted), 0)::int as "count"
      FROM grievance_daily_agg
      WHERE society_id = $1 AND date >= CURRENT_DATE - $2::int
      GROUP BY priority;
    `, [societyId, days]);

    // 5. Aging Buckets (Live open inventory)
    const agingRes = await pool.query(`
      SELECT created_at
      FROM grievance
      WHERE society_id = $1 AND status NOT IN ('RESOLVED', 'CLOSED', 'DRAFT');
    `, [societyId]);

    const agingBuckets = { zeroToOneDays: 0, oneToThreeDays: 0, threeToSevenDays: 0, sevenPlusDays: 0 };
    for (const row of agingRes.rows) {
      const bucket = this.metricsService.calculateAgingBucket(new Date(row.created_at));
      if (bucket === '0-1') agingBuckets.zeroToOneDays++;
      else if (bucket === '1-3') agingBuckets.oneToThreeDays++;
      else if (bucket === '3-7') agingBuckets.threeToSevenDays++;
      else agingBuckets.sevenPlusDays++;
    }

    // 6. Wing Heatmap (Named complaints only + small cell suppression)
    const wingRes = await pool.query(`
      SELECT
        w.id as "wingId",
        w.name as "wingName",
        c.id as "categoryId",
        c.name_en as "categoryName",
        COALESCE(SUM(wda.submitted), 0)::int as "count"
      FROM wing w
      CROSS JOIN category c
      LEFT JOIN wing_daily_agg wda ON w.id = wda.wing_id AND c.id = wda.category_id AND wda.society_id = $1 AND wda.date >= CURRENT_DATE - $2::int
      WHERE w.society_id = $1 AND c.society_id = $1
      GROUP BY w.id, w.name, c.id, c.name_en
      ORDER BY w.name, c.name_en;
    `, [societyId, days]);

    const wingItems = wingRes.rows.map((r) => ({ item: r, count: r.count }));
    const { suppressedCells } = this.metricsService.applySmallNumberSuppression(wingItems, settings.minCellSize);
    const wingHeatmap = suppressedCells.map((sc) => ({
      wingId: sc.item.wingId,
      wingName: sc.item.wingName,
      categoryId: sc.item.categoryId,
      categoryName: sc.item.categoryName,
      count: sc.count,
      isSuppressed: sc.isSuppressed,
      displayValue: sc.displayValue,
    }));

    // 7. Level Funnel
    const funnelRes = await pool.query(`
      SELECT
        gda.level,
        COALESCE(SUM(gda.submitted), 0)::int as "enteredCount",
        COALESCE(SUM(gda.resolved), 0)::int as "resolvedCount",
        COALESCE(SUM(gda.escalated), 0)::int as "escalatedOutCount",
        COALESCE(SUM(lta.minutes_sum), 0)::bigint as "minutesSum",
        COALESCE(SUM(lta.count), 0)::int as "lvlCount"
      FROM grievance_daily_agg gda
      LEFT JOIN level_time_agg lta ON gda.society_id = lta.society_id AND gda.date = lta.date AND gda.level = lta.level
      WHERE gda.society_id = $1 AND gda.date >= CURRENT_DATE - $2::int
      GROUP BY gda.level
      ORDER BY gda.level;
    `, [societyId, days]);

    const levelNames: Record<number, string> = {
      1: 'Level 1: Secretary',
      2: 'Level 2: Committee',
      3: 'Level 3: Chairman',
      4: 'Level 4: Governing Body',
    };

    const levelFunnel = [1, 2, 3, 4].map((lvl) => {
      const row = funnelRes.rows.find((r) => r.level === lvl);
      const enteredCount = row ? row.enteredCount : 0;
      const resolved = row ? row.resolvedCount : 0;
      const escalatedOut = row ? row.escalatedOutCount : 0;
      const mSum = row ? Number(row.minutesSum) : 0;
      const lCount = row ? row.lvlCount : 0;
      const avgMinutes = lCount > 0 ? Math.round(mSum / lCount) : 0;

      return {
        level: lvl,
        levelName: levelNames[lvl] || `Level ${lvl}`,
        enteredCount,
        resolvedCount: resolved,
        escalatedOutCount: escalatedOut,
        avgMinutes,
      };
    });

    // 8. FINAL_LEVEL_OVERDUE List (Tickets at Level 4 past due time)
    const overdueRes = await pool.query(`
      SELECT
        g.id,
        g.public_id as "publicId",
        g.title,
        c.name_en as "categoryName",
        g.priority,
        ROUND(EXTRACT(EPOCH FROM (NOW() - g.sla_due_at)) / 3600)::int as "hoursOverdue",
        g.sla_due_at as "slaDueAt"
      FROM grievance g
      JOIN category c ON g.category_id = c.id
      WHERE g.society_id = $1
        AND g.current_level = 4
        AND g.status NOT IN ('RESOLVED', 'CLOSED', 'DRAFT')
        AND g.sla_due_at < NOW()
      ORDER BY g.sla_due_at ASC;
    `, [societyId]);

    return {
      kpis: {
        totalSubmitted,
        openLoad,
        resolvedCount,
        avgResolutionHours,
        slaComplianceRate,
        satisfactionScore,
        appealsCount,
        reopensCount,
      },
      trend: trendRes.rows,
      categoryMix,
      priorityMix: priorityRes.rows,
      agingBuckets,
      wingHeatmap,
      levelFunnel,
      finalLevelOverdue: overdueRes.rows,
    };
  }

  /**
   * GET /admin/performance (Fair Resolver Performance Tracking)
   */
  async getResolverPerformance(
    societyId: string,
    level?: number,
    currentUserId?: string,
    userRole?: string
  ): Promise<ResolverSummaryDto[]> {
    const isLeadership = ['COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY', 'SUPER_ADMIN'].includes(userRole || '');
    const settings = await this.getSocietySettings(societyId);

    let query = `
      SELECT
        u.id as "userId",
        u.full_name as "fullName",
        rda.level,
        COALESCE(SUM(rda.assigned), 0)::int as "assigned",
        COALESCE(SUM(rda.acknowledged), 0)::int as "acknowledged",
        COALESCE(SUM(rda.resolved), 0)::int as "resolved",
        COALESCE(SUM(rda.breaches_while_assigned), 0)::int as "breachesWhileAssigned",
        COALESCE(SUM(rda.reopened), 0)::int as "reopened",
        COALESCE(SUM(rda.ack_minutes_sum), 0)::bigint as "ackMinutesSum",
        COALESCE(SUM(rda.resolution_minutes_sum), 0)::bigint as "resolutionMinutesSum",
        COALESCE(SUM(rda.rating_sum), 0)::int as "ratingSum",
        COALESCE(SUM(rda.rating_count), 0)::int as "ratingCount"
      FROM app_user u
      JOIN resolver_daily_agg rda ON u.id = rda.user_id AND rda.society_id = $1
      WHERE u.society_id = $1
    `;
    const params: any[] = [societyId];

    if (!isLeadership) {
      // Resolver sees ONLY their own statistics
      params.push(currentUserId);
      query += ` AND u.id = $${params.length}`;
    }

    if (level) {
      // Isolate by governance level (never rank across different levels together)
      params.push(level);
      query += ` AND rda.level = $${params.length}`;
    }

    query += `
      GROUP BY u.id, u.full_name, rda.level
      ORDER BY rda.level ASC, "resolved" DESC;
    `;

    const res = await pool.query(query, params);

    // Fetch live open load for each user
    const liveLoadRes = await pool.query(`
      SELECT assigned_to as "userId", COUNT(*)::int as "currentLoad"
      FROM grievance
      WHERE society_id = $1 AND status NOT IN ('RESOLVED', 'CLOSED', 'DRAFT') AND assigned_to IS NOT NULL
      GROUP BY assigned_to;
    `, [societyId]);
    const liveLoadMap = new Map<string, number>();
    for (const r of liveLoadRes.rows) {
      liveLoadMap.set(r.userId, r.currentLoad);
    }

    const levelNames: Record<number, string> = {
      1: 'Level 1: Secretary',
      2: 'Level 2: Committee',
      3: 'Level 3: Chairman',
      4: 'Level 4: Governing Body',
    };

    return res.rows.map((row) => {
      const assigned = row.assigned;
      const acknowledged = row.acknowledged;
      const resolved = row.resolved;
      const breaches = row.breachesWhileAssigned;
      const ackMSum = Number(row.ackMinutesSum);
      const resMSum = Number(row.resolutionMinutesSum);
      const rSum = row.ratingSum;
      const rCount = row.ratingCount;

      const ackWithinSlaRate = assigned > 0 ? Math.round((acknowledged / assigned) * 100) : 100;
      const avgAckMinutes = acknowledged > 0 ? Math.round(ackMSum / acknowledged) : 0;
      const avgResolutionMinutes = resolved > 0 ? Math.round(resMSum / resolved) : 0;
      const reopenRate = resolved > 0 ? Math.round((row.reopened / resolved) * 100) : 0;
      const avgRating = rCount >= settings.minCellSize ? parseFloat((rSum / rCount).toFixed(1)) : null;

      // Evaluate fair performance rules
      const perf = this.metricsService.evaluateResolverPerformance(resolved, breaches, {
        excellent: settings.perfThresholdExcellent,
        onTrack: settings.perfThresholdOnTrack,
      });

      return {
        userId: row.userId,
        fullName: row.fullName,
        level: row.level,
        levelName: levelNames[row.level] || `Level ${row.level}`,
        assigned,
        resolved,
        acknowledgedWithinSlaRate: ackWithinSlaRate,
        avgAckMinutes,
        avgResolutionMinutes,
        slaHitRate: perf.slaHitRate,
        breachesWhileAssigned: breaches,
        reopenRate,
        avgRating,
        ratingCount: rCount,
        currentOpenLoad: liveLoadMap.get(row.userId) || 0,
        performanceLabel: perf.label,
        isSampleSizeSufficient: perf.isSampleSizeSufficient,
      };
    });
  }

  /**
   * GET /admin/performance/:userId (Resolver drill-down)
   */
  async getResolverDetail(
    societyId: string,
    targetUserId: string,
    currentUserId: string,
    userRole?: string
  ): Promise<ResolverDetailDto> {
    const isLeadership = ['COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY', 'SUPER_ADMIN'].includes(userRole || '');
    if (!isLeadership && currentUserId !== targetUserId) {
      throw new ForbiddenException('Access denied: You can only view your own performance records');
    }

    const summaries = await this.getResolverPerformance(societyId, undefined, targetUserId, 'SUPER_ADMIN');
    const summary = summaries[0];
    if (!summary) {
      throw new NotFoundException('Resolver not found or has no activity');
    }

    // Fetch recent SLA breaches while assigned to this user
    const breachRes = await pool.query(`
      SELECT
        el.id,
        g.public_id as "publicId",
        c.name_en as "categoryName",
        el.level_from as "levelFrom",
        el.level_to as "levelTo",
        el.reason,
        ROUND(EXTRACT(EPOCH FROM (el.created_at - g.sla_due_at)) / 3600)::int as "hoursOverdue",
        u.full_name as "resolverAtTime",
        el.created_at as "occurredAt"
      FROM escalation_log el
      JOIN grievance g ON el.grievance_id = g.id
      JOIN category c ON g.category_id = c.id
      LEFT JOIN app_user u ON el.actor_id = u.id
      WHERE g.society_id = $1 AND el.actor_id = $2 AND el.reason = 'AUTO_SLA'
      ORDER BY el.created_at DESC
      LIMIT 20;
    `, [societyId, targetUserId]);

    // Fetch daily trend for resolver
    const trendRes = await pool.query(`
      SELECT
        date::text as "date",
        COALESCE(resolved, 0) as "resolved",
        COALESCE(breaches_while_assigned, 0) as "breaches"
      FROM resolver_daily_agg
      WHERE society_id = $1 AND user_id = $2
      ORDER BY date ASC
      LIMIT 30;
    `, [societyId, targetUserId]);

    return {
      userId: summary.userId,
      fullName: summary.fullName,
      level: summary.level,
      levelName: summary.levelName,
      assigned: summary.assigned,
      resolved: summary.resolved,
      acknowledgedWithinSlaRate: summary.acknowledgedWithinSlaRate,
      avgAckMinutes: summary.avgAckMinutes,
      avgResolutionMinutes: summary.avgResolutionMinutes,
      slaHitRate: summary.slaHitRate,
      breachesWhileAssigned: summary.breachesWhileAssigned,
      reopenRate: summary.reopenRate,
      avgRating: summary.avgRating,
      ratingCount: summary.ratingCount,
      currentOpenLoad: summary.currentOpenLoad,
      performanceLabel: summary.performanceLabel,
      isSampleSizeSufficient: summary.isSampleSizeSufficient,
      recentBreaches: breachRes.rows,
      dailyTrend: trendRes.rows,
    };
  }

  /**
   * GET /admin/sla-breaches (All auto-escalations)
   */
  async getSlaBreaches(
    societyId: string,
    _filters: any = {},
    page: number = 1,
    limit: number = 20
  ): Promise<SlaBreachReportDto> {
    const offset = (page - 1) * limit;
    const countRes = await pool.query(`
      SELECT COUNT(*)::int as total
      FROM escalation_log el
      JOIN grievance g ON el.grievance_id = g.id
      WHERE g.society_id = $1 AND el.reason = 'AUTO_SLA';
    `, [societyId]);

    const total = countRes.rows[0]?.total || 0;

    const itemsRes = await pool.query(`
      SELECT
        el.id,
        g.public_id as "publicId",
        c.name_en as "categoryName",
        el.level_from as "levelFrom",
        el.level_to as "levelTo",
        el.reason,
        ROUND(EXTRACT(EPOCH FROM (el.created_at - g.sla_due_at)) / 3600)::int as "hoursOverdue",
        u.full_name as "resolverAtTime",
        el.created_at as "occurredAt"
      FROM escalation_log el
      JOIN grievance g ON el.grievance_id = g.id
      JOIN category c ON g.category_id = c.id
      LEFT JOIN app_user u ON el.actor_id = u.id
      WHERE g.society_id = $1 AND el.reason = 'AUTO_SLA'
      ORDER BY el.created_at DESC
      LIMIT $2 OFFSET $3;
    `, [societyId, limit, offset]);

    return {
      items: itemsRes.rows,
      total,
      page,
      limit,
    };
  }

  /**
   * GET /admin/reports/:type (Export generation)
   */
  async exportReport(
    societyId: string,
    type: ReportType,
    format: ReportFormat,
    filters: any,
    actor: { userId: string; role: string; ip?: string }
  ): Promise<{ data: any; contentType: string; filename: string }> {
    const socRes = await pool.query('SELECT name FROM society WHERE id = $1', [societyId]);
    const societyName = socRes.rows[0]?.name || 'Society';

    // Fetch latest audit chain hash for verification stamp
    const latestAudit = await pool.query(
      'SELECT hash FROM audit_log WHERE society_id = $1 ORDER BY seq DESC LIMIT 1',
      [societyId]
    );
    const auditHash = latestAudit.rows[0]?.hash || '0'.repeat(64);

    let title = 'Governance Report';
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (type === 'category-trends') {
      title = 'Category Trends & Resolution Report';
      headers = ['Category', 'Submitted', 'Resolved', 'Avg Resolution (Hours)', 'Resolution %'];
      const data = await pool.query(`
        SELECT
          c.name_en as "category",
          COALESCE(SUM(gda.submitted), 0)::int as "sub",
          COALESCE(SUM(gda.resolved), 0)::int as "res",
          COALESCE(SUM(gda.resolution_minutes_sum), 0)::bigint as "minSum",
          COALESCE(SUM(gda.resolution_count), 0)::int as "resCount"
        FROM category c
        LEFT JOIN grievance_daily_agg gda ON c.id = gda.category_id AND gda.society_id = $1
        WHERE c.society_id = $1
        GROUP BY c.id, c.name_en
        ORDER BY "sub" DESC;
      `, [societyId]);

      rows = data.rows.map((r) => {
        const sub = r.sub;
        const res = r.res;
        const avgH = r.resCount > 0 ? (r.minSum / r.resCount / 60).toFixed(1) : '0.0';
        const pct = sub > 0 ? `${Math.round((res / sub) * 100)}%` : '0%';
        return [r.category, sub, res, avgH, pct];
      });
    } else if (type === 'resolver-performance') {
      title = 'Resolver Performance & Accountability Report';
      headers = ['Resolver Name', 'Level', 'Assigned', 'Resolved', 'SLA Hit Rate', 'Breaches', 'Rating', 'Label'];
      const resolvers = await this.getResolverPerformance(societyId, undefined, actor.userId, actor.role);
      rows = resolvers.map((r) => [
        r.fullName,
        r.levelName,
        r.assigned,
        (r as any).resolved || r.assigned,
        r.slaHitRate !== null ? `${r.slaHitRate}%` : 'N/A (<5)',
        r.breachesWhileAssigned,
        r.avgRating !== null ? `${r.avgRating} ★` : 'N/A',
        r.performanceLabel,
      ]);
    } else if (type === 'sla-breaches') {
      title = 'Auto-Escalation & SLA Breach Ledger';
      headers = ['Grievance ID', 'Category', 'Level From', 'Level To', 'Hours Overdue', 'Resolver At Time', 'Timestamp'];
      const breaches = await this.getSlaBreaches(societyId, filters, 1, 500);
      rows = breaches.items.map((b) => [
        b.publicId,
        b.categoryName,
        `Level ${b.levelFrom}`,
        `Level ${b.levelTo}`,
        `${b.hoursOverdue}h`,
        b.resolverAtTime || 'Unassigned',
        new Date(b.occurredAt).toISOString(),
      ]);
    } else {
      // Default: monthly-summary
      title = 'Monthly Governance Summary';
      headers = ['Metric Name', 'Count / Value', 'Benchmark Standard'];
      const summary = await this.getAdminAnalytics(societyId, { range: '30d' });
      rows = [
        ['Total Complaints Received', summary.kpis.totalSubmitted, 'Total Volume'],
        ['Complaints Successfully Resolved', summary.kpis.resolvedCount, 'Target >= 85%'],
        ['Active Open Load', summary.kpis.openLoad, 'Inventory'],
        ['Average Net Resolution Time', `${summary.kpis.avgResolutionHours} hours`, 'Target <= 48 hours'],
        ['Overall SLA Compliance Rate', `${summary.kpis.slaComplianceRate}%`, 'Target >= 80%'],
        ['Resident Satisfaction Score', summary.kpis.satisfactionScore ? `${summary.kpis.satisfactionScore} ★` : 'Insufficient Data', 'Scale 1-5'],
        ['Appeals Filed to Level 4', summary.kpis.appealsCount, 'Friction Indicator'],
      ];
    }

    // Write audit log entry
    await this.auditService.append({
      societyId,
      actorId: actor.userId,
      actorRole: actor.role,
      action: 'REPORT_EXPORTED',
      entityType: 'REPORT',
      entityId: type,
      after: { type, format, filters, rowCount: rows.length },
      ip: actor.ip,
    });

    const timestampStr = new Date().toISOString().slice(0, 10);
    const filename = `${type}_${timestampStr}.${format}`;

    if (format === 'xlsx') {
      const buffer = this.reportExporterService.generateExcel(type, headers, rows);
      return {
        data: buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename,
      };
    } else if (format === 'pdf') {
      const buffer = await this.reportExporterService.generatePdf(
        title,
        societyName,
        filters,
        headers,
        rows,
        auditHash
      );
      return {
        data: buffer,
        contentType: 'application/pdf',
        filename,
      };
    }

    // JSON fallback
    return {
      data: {
        title,
        societyName,
        auditHash,
        headers,
        rows,
      },
      contentType: 'application/json',
      filename,
    };
  }

  /**
   * Helper to build public / resident dashboard payload from pre-aggregation tables.
   */
  private async buildDashboardPayload(
    societyId: string,
    societyName: string,
    societySlug: string,
    range: AnalyticsRange,
    minCellSize: number
  ): Promise<PublicDashboardStatsDto> {
    const days = range === '12m' ? 365 : range === '90d' ? 90 : 30;

    // 1. Summary totals
    const sumRes = await pool.query(`
      SELECT
        COALESCE(SUM(resolved), 0)::int as "resolvedCount",
        COALESCE(SUM(resolution_minutes_sum), 0)::bigint as "resMinutesSum",
        COALESCE(SUM(resolution_count), 0)::int as "resCount",
        COALESCE(SUM(escalated), 0)::int as "escalatedCount"
      FROM grievance_daily_agg
      WHERE society_id = $1 AND date >= CURRENT_DATE - $2::int;
    `, [societyId, days]);

    const liveOpenRes = await pool.query(`
      SELECT COUNT(*)::int as "openLoad"
      FROM grievance
      WHERE society_id = $1 AND status NOT IN ('RESOLVED', 'CLOSED', 'DRAFT');
    `, [societyId]);

    const resolvedCount = sumRes.rows[0]?.resolvedCount || 0;
    const resMinutesSum = Number(sumRes.rows[0]?.resMinutesSum || 0);
    const resCount = sumRes.rows[0]?.resCount || 0;
    const escalatedCount = sumRes.rows[0]?.escalatedCount || 0;
    const openLoad = liveOpenRes.rows[0]?.openLoad || 0;

    const avgResolutionHours = resCount > 0 ? parseFloat((resMinutesSum / resCount / 60).toFixed(1)) : 0;
    const totalHandled = resolvedCount + escalatedCount;
    const escalationRate = totalHandled > 0 ? Math.round((escalatedCount / totalHandled) * 100) : 0;

    // 2. Status Split
    const statusRes = await pool.query(`
      SELECT status, COUNT(*)::int as count
      FROM grievance
      WHERE society_id = $1 AND status != 'DRAFT'
      GROUP BY status;
    `, [societyId]);

    // 3. Resolution by Category
    const catRes = await pool.query(`
      SELECT
        c.id as "categoryId",
        c.name_en as "categoryName",
        COALESCE(SUM(gda.resolved), 0)::int as "resolvedCount",
        COALESCE(SUM(gda.resolution_minutes_sum), 0)::bigint as "minSum",
        COALESCE(SUM(gda.resolution_count), 0)::int as "resCount"
      FROM category c
      LEFT JOIN grievance_daily_agg gda ON c.id = gda.category_id AND gda.society_id = $1 AND gda.date >= CURRENT_DATE - $2::int
      WHERE c.society_id = $1
      GROUP BY c.id, c.name_en
      ORDER BY "resolvedCount" DESC;
    `, [societyId, days]);

    const resolutionByCategory = catRes.rows.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      resolvedCount: r.resolvedCount,
      avgHours: r.resCount > 0 ? parseFloat((r.minSum / r.resCount / 60).toFixed(1)) : 0,
    }));

    // 4. Average Time per Level (4-level chain visual with real numbers)
    const lvlRes = await pool.query(`
      SELECT
        level,
        COALESCE(SUM(minutes_sum), 0)::bigint as "minSum",
        COALESCE(SUM(count), 0)::int as "count"
      FROM level_time_agg
      WHERE society_id = $1 AND date >= CURRENT_DATE - $2::int
      GROUP BY level
      ORDER BY level;
    `, [societyId, days]);

    const averageTimePerLevel = [1, 2, 3, 4].map((lvl) => {
      const row = lvlRes.rows.find((r) => r.level === lvl);
      const minSum = row ? Number(row.minSum) : 0;
      const count = row ? row.count : 0;
      const avgMinutes = count > 0 ? Math.round(minSum / count) : 0;
      return {
        level: lvl,
        avgMinutes,
        avgHours: parseFloat((avgMinutes / 60).toFixed(1)),
        count,
      };
    });

    // 5. Satisfaction
    const satRes = await pool.query(`
      SELECT
        COALESCE(SUM(rating_1_count), 0)::int as "r1",
        COALESCE(SUM(rating_2_count), 0)::int as "r2",
        COALESCE(SUM(rating_3_count), 0)::int as "r3",
        COALESCE(SUM(rating_4_count), 0)::int as "r4",
        COALESCE(SUM(rating_5_count), 0)::int as "r5",
        COALESCE(SUM(rating_sum), 0)::int as "sum",
        COALESCE(SUM(rating_count), 0)::int as "count"
      FROM rating_daily_agg
      WHERE society_id = $1 AND date >= CURRENT_DATE - $2::int;
    `, [societyId, days]);

    const satRow = satRes.rows[0];
    const ratedCount = satRow ? satRow.count : 0;
    const satisfactionScore = ratedCount >= minCellSize ? parseFloat((satRow.sum / ratedCount).toFixed(1)) : null;

    const satisfactionBreakdown = [
      { stars: 5, count: satRow ? satRow.r5 : 0 },
      { stars: 4, count: satRow ? satRow.r4 : 0 },
      { stars: 3, count: satRow ? satRow.r3 : 0 },
      { stars: 2, count: satRow ? satRow.r2 : 0 },
      { stars: 1, count: satRow ? satRow.r1 : 0 },
    ];

    // 6. 12-Month Trend
    const trendRes = await pool.query(`
      SELECT
        TO_CHAR(date, 'YYYY-MM') as month,
        COALESCE(SUM(submitted), 0)::int as "submitted",
        COALESCE(SUM(resolved), 0)::int as "resolved"
      FROM grievance_daily_agg
      WHERE society_id = $1 AND date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month ASC;
    `, [societyId]);

    // 7. Top Recurring Issues (Category + Area Tag, >= 3 in 30 days, zero PII!)
    const recurRes = await pool.query(`
      SELECT
        c.name_en as "categoryName",
        COALESCE(at.name, 'Common Society Premises') as "areaTagName",
        COUNT(g.id)::int as count
      FROM grievance g
      JOIN category c ON g.category_id = c.id
      LEFT JOIN area_tag at ON g.area_tag_id = at.id
      WHERE g.society_id = $1 AND g.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY c.name_en, at.name
      HAVING COUNT(g.id) >= 3
      ORDER BY count DESC
      LIMIT 5;
    `, [societyId]);

    return {
      societyName,
      societySlug,
      summaryCards: {
        openLoad,
        resolvedCount,
        avgResolutionHours,
        satisfactionScore,
        ratedCount,
        escalationRate,
      },
      statusSplit: statusRes.rows,
      resolutionByCategory,
      averageTimePerLevel,
      satisfaction: {
        score: satisfactionScore,
        count: ratedCount,
        breakdown: satisfactionBreakdown,
      },
      twelveMonthTrend: trendRes.rows,
      topRecurringIssues: recurRes.rows,
      suppressed: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Update Analytics & Transparency Settings (Super Admin only, step-up audited)
   */
  async updateSettings(
    societyId: string,
    dto: AnalyticsSettingsDto,
    actor: { userId: string; role: string; ip?: string }
  ) {
    if (actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only Super Admin can modify analytics & transparency settings');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const settingsPairs = [
        ['public_dashboard_enabled', String(dto.publicDashboardEnabled)],
        ['public_dashboard_visibility', dto.publicDashboardVisibility],
        ['min_cell_size', String(dto.minCellSize)],
        ['perf_threshold_excellent', String(dto.perfThresholdExcellent)],
        ['perf_threshold_on_track', String(dto.perfThresholdOnTrack)],
      ];

      for (const [key, value] of settingsPairs) {
        await client.query(
          `INSERT INTO society_setting (society_id, key, value, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (society_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [societyId, key, value]
        );
      }

      await client.query('COMMIT');

      await this.auditService.append({
        societyId,
        actorId: actor.userId,
        actorRole: actor.role,
        action: 'ANALYTICS_SETTINGS_UPDATED',
        entityType: 'SOCIETY_SETTING',
        after: dto as any,
        ip: actor.ip,
      });

      return { success: true };
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
