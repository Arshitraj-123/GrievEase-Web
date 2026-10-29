import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { pool } from '../../database/db';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AppStorageService } from '../storage/storage.service';
import { EscalationService } from '../escalation/escalation.service';
import { GrievanceStateMachine } from './grievance-state-machine';
import { computeSlaDueAt } from './sla-calculator';
import {
  encryptSubmitter,
  decryptSubmitter,
  generateBlindIndex,
  generateTrackingCode,
  hashTrackingCode,
} from '../../common/utils/anonymity-crypto';
import {
  CreateGrievanceDto,
  UpdateGrievanceStatusDto,
  AddGrievanceNoteDto,
  RequestInfoDto,
  ManualEscalateDto,
  GrievanceAppealDto,
  GrievanceRateDto,
  GrievanceFlagDto,
  GrievanceAssignDto,
  RevealIdentityDto,
  GrievanceStatus,
} from '@grievease/contracts';

@Injectable()
export class GrievancesService {
  constructor(
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    private gateway: NotificationsGateway,
    private storageService: AppStorageService,
    private escalationService: EscalationService
  ) {}

  private getAnonEncryptionKey(): string {
    return (
      process.env.ANON_ENCRYPTION_KEY ||
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    );
  }

  // ==========================================
  // 1. SUBMISSION & CREATION
  // ==========================================
  async createGrievance(societyId: string, user: any, dto: CreateGrievanceDto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // 1. Fetch Society Settings
      const settingsRes = await client.query(
        `SELECT key, value FROM society_setting WHERE society_id = $1;`,
        [societyId]
      );
      const settings: Record<string, any> = {
        rate_limit_per_24h: 5,
        duplicate_window_days: 7,
        emergency_bypass_to_level: 2,
        chairman_alert_minutes: 30,
        warn_before_hours: 12,
        max_evidence: 10,
      };
      for (const r of settingsRes.rows) {
        settings[r.key] = isNaN(Number(r.value)) ? r.value : Number(r.value);
      }

      // Check max evidence files limit
      if (dto.evidenceKeys && dto.evidenceKeys.length > settings.max_evidence) {
        throw new BadRequestException(`Maximum ${settings.max_evidence} evidence files allowed.`);
      }

      // 2. Validate Occurred At not in future
      if (dto.occurredAt && new Date(dto.occurredAt).getTime() > Date.now() + 60000) {
        throw new BadRequestException('Occurred date cannot be in the future.');
      }

      // 3. Compute Blind Index for submitter
      const anonKey = this.getAnonEncryptionKey();
      const blindIndex = generateBlindIndex(anonKey, societyId, user.userId);

      // 4. Rate Limit Check: Rate limit enforced identically for named and anonymous
      const countRes = await client.query(
        `SELECT COUNT(*) as count FROM grievance
         WHERE society_id = $1
           AND (submitter_user_id = $2 OR submitter_blind_index = $3)
           AND created_at > NOW() - INTERVAL '24 HOURS';`,
        [societyId, user.userId, blindIndex]
      );
      if (Number(countRes.rows[0].count) >= settings.rate_limit_per_24h) {
        throw new ConflictException(
          `Daily submission limit reached (${settings.rate_limit_per_24h} complaints per 24 hours).`
        );
      }

      // 5. Trigram Duplicate Check within duplicate_window_days
      if (!dto.confirmDuplicate) {
        const dupRes = await client.query(
          `SELECT id, public_id, title, status, similarity(title, $1) as sim
           FROM grievance
           WHERE society_id = $2
             AND category_id = $3
             AND (submitter_user_id = $4 OR submitter_blind_index = $5)
             AND created_at > NOW() - make_interval(days => $6)
             AND similarity(title, $1) > 0.35
           ORDER BY sim DESC
           LIMIT 3;`,
          [dto.title, societyId, dto.categoryId, user.userId, blindIndex, settings.duplicate_window_days]
        );

        if (dupRes.rows.length > 0) {
          throw new ConflictException({
            code: 'DUPLICATE_WARNING',
            message: 'A similar grievance was submitted recently.',
            matches: dupRes.rows.map((m: any) => ({
              id: m.id,
              publicId: m.public_id,
              title: m.title,
              status: m.status,
            })),
          });
        }
      }

      // 6. Generate locked counter Public ID: GR-YYYY-NNNN
      const currentYear = new Date().getFullYear();
      await client.query(
        `INSERT INTO grievance_counter (society_id, year, last_number)
         VALUES ($1, $2, 0)
         ON CONFLICT (society_id, year) DO NOTHING;`,
        [societyId, currentYear]
      );

      const counterRes = await client.query(
        `SELECT last_number FROM grievance_counter
         WHERE society_id = $1 AND year = $2 FOR UPDATE;`,
        [societyId, currentYear]
      );
      const nextNum = Number(counterRes.rows[0].last_number) + 1;
      await client.query(
        `UPDATE grievance_counter SET last_number = $1 WHERE society_id = $2 AND year = $3;`,
        [nextNum, societyId, currentYear]
      );
      const paddedNum = String(nextNum).padStart(4, '0');
      const publicId = `GR-${currentYear}-${paddedNum}`;

      // 7. Determine initial level and assignee
      let initialLevel = 1;
      if (dto.priority === 'EMERGENCY') {
        initialLevel = settings.emergency_bypass_to_level || 2;
      }

      // Find primary assignee for initial level (skip on leave)
      const assignRes = await client.query(
        `SELECT ga.user_id, u.full_name
         FROM governance_assignment ga
         JOIN app_user u ON ga.user_id = u.id
         WHERE ga.society_id = $1 AND ga.level = $2
           AND (ga.active_to IS NULL OR ga.active_to > NOW())
           AND ga.user_id NOT IN (
             SELECT user_id FROM resolver_leave WHERE NOW() BETWEEN from_at AND to_at
           )
         ORDER BY ga.is_primary DESC
         LIMIT 1;`,
        [societyId, initialLevel]
      );
      const assignedUserId = assignRes.rows[0]?.user_id || null;

      // 8. Compute SLA Due Date
      const slaRes = await client.query(
        `SELECT hours FROM sla_config
         WHERE society_id = $1 AND priority = $2 AND level = $3;`,
        [societyId, dto.priority, initialLevel]
      );
      const levelHours = Number(slaRes.rows[0]?.hours || 48);

      const whRes = await client.query(
        `SELECT weekday, start_time as "startTime", end_time as "endTime", enabled
         FROM working_hours WHERE society_id = $1;`,
        [societyId]
      );
      const slaDueAt = computeSlaDueAt(new Date(), levelHours, whRes.rows);

      // 9. Generate Single-Use Tracking Code
      const trackingCode = generateTrackingCode();
      const trackingHash = hashTrackingCode(trackingCode);

      // 10. Submitter identity handling (Anonymous vs Named)
      let submitterUserId: string | null = user.userId;
      let flatId: string | null = user.flatId || null;

      if (dto.isAnonymous) {
        submitterUserId = null;
        flatId = null;
      }

      // 11. Insert Grievance
      const gRes = await client.query(
        `INSERT INTO grievance (
          society_id, public_id, category_id, title, description, priority,
          area_text, area_tag_id, occurred_at, status, current_level, assigned_to,
          sla_due_at, is_anonymous, submitter_user_id, submitter_blind_index,
          flat_id, tracking_code_hash
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW()), 'SUBMITTED', $10,
          $11, $12, $13, $14, $15, $16, $17
        ) RETURNING *;`,
        [
          societyId,
          publicId,
          dto.categoryId,
          dto.title.trim(),
          dto.description.trim(),
          dto.priority,
          dto.areaText || null,
          dto.areaTagId || null,
          dto.occurredAt || null,
          initialLevel,
          assignedUserId,
          slaDueAt,
          dto.isAnonymous,
          submitterUserId,
          blindIndex,
          flatId,
          trackingHash,
        ]
      );
      const createdGrievance = gRes.rows[0];

      // 12. If Anonymous: Encrypt identity into anonymous_identity table
      if (dto.isAnonymous) {
        // Fetch full submitter details to store securely in AES-256-GCM vault
        const userRow = await client.query(
          `SELECT u.id, u.full_name, u.mobile, u.email, f.flat_number
           FROM app_user u
           LEFT JOIN flat f ON u.flat_id = f.id
           WHERE u.id = $1;`,
          [user.userId]
        );
        const { encryptedPayload, keyVersion } = encryptSubmitter(
          userRow.rows[0] || { userId: user.userId },
          anonKey
        );

        await client.query(
          `INSERT INTO anonymous_identity (grievance_id, society_id, encrypted_submitter, key_version)
           VALUES ($1, $2, $3, $4);`,
          [createdGrievance.id, societyId, encryptedPayload, keyVersion]
        );
      }

      // 13. Link Evidence Files
      if (dto.evidenceKeys && dto.evidenceKeys.length > 0) {
        for (const storageKey of dto.evidenceKeys) {
          const ext = storageKey.split('.').pop() || '';
          const mime = ext.includes('pdf')
            ? 'application/pdf'
            : ext.includes('mp4')
            ? 'video/mp4'
            : 'image/jpeg';

          await client.query(
            `INSERT INTO evidence (
              society_id, grievance_id, uploader_id, storage_key, mime, size, sha256
            ) VALUES ($1, $2, $3, $4, $5, 1024, 'sha256_placeholder');`,
            [
              societyId,
              createdGrievance.id,
              dto.isAnonymous ? null : user.userId,
              storageKey,
              mime,
            ]
          );
        }
      }

      // 14. Co-complainants
      if (dto.coComplainants && dto.coComplainants.length > 0) {
        for (const coId of dto.coComplainants) {
          await client.query(
            `INSERT INTO co_complainant (society_id, grievance_id, user_id)
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;`,
            [societyId, createdGrievance.id, coId]
          );
        }
      }

      // 15. Grievance Event (Seq 1)
      await client.query(
        `INSERT INTO grievance_event (
          society_id, grievance_id, seq, type, actor_id, actor_role, visibility, payload
        ) VALUES ($1, $2, 1, 'SUBMITTED', $3, $4, 'RESIDENT', $5);`,
        [
          societyId,
          createdGrievance.id,
          dto.isAnonymous ? null : user.userId,
          user.role || 'RESIDENT',
          JSON.stringify({
            publicId,
            priority: dto.priority,
            assignedLevel: initialLevel,
            isAnonymous: dto.isAnonymous,
            slaDueAt: slaDueAt.toISOString(),
          }),
        ]
      );

      // 16. Audit Log (Never leak identity if anonymous)
      await this.auditService.append({
        societyId,
        actorId: dto.isAnonymous ? null : user.userId,
        actorRole: user.role || 'RESIDENT',
        action: 'GRIEVANCE_CREATED',
        entityType: 'grievance',
        entityId: createdGrievance.id,
        after: {
          publicId,
          isAnonymous: dto.isAnonymous,
          priority: dto.priority,
          level: initialLevel,
        },
      });

      // Clear any existing draft for this user
      await client.query(`DELETE FROM grievance_draft WHERE user_id = $1;`, [user.userId]);

      await client.query('COMMIT');

      // 17. Notifications & Escalation jobs (outside transaction)
      if (assignedUserId) {
        await this.notificationsService.send({
          societyId,
          userId: assignedUserId,
          title: `New Grievance Assigned: ${publicId}`,
          message: `Priority ${dto.priority}: "${dto.title}". Due: ${slaDueAt.toLocaleDateString()}`,
          type: dto.priority === 'EMERGENCY' ? 'ALERT' : 'INFO',
          link: `/admin/grievances/${createdGrievance.id}`,
        });
      }

      await this.escalationService.scheduleEscalationJobs(
        createdGrievance.id,
        societyId,
        initialLevel,
        slaDueAt,
        settings.warn_before_hours
      );

      this.gateway.emitToGrievance(createdGrievance.id, 'grievance.created', {
        id: createdGrievance.id,
        publicId,
        priority: dto.priority,
        status: 'SUBMITTED',
        level: initialLevel,
        slaDueAt: slaDueAt.toISOString(),
      });

      return {
        id: createdGrievance.id,
        publicId,
        expectedDate: slaDueAt.toISOString(),
        assignedLevel: initialLevel,
        trackingCode: dto.isAnonymous ? trackingCode : undefined,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ==========================================
  // 2. QUERY & SERIALIZATION (STRICT ANONYMITY)
  // ==========================================
  private serializeForResident(row: any, isOwner: boolean = false) {
    return {
      id: row.id,
      publicId: row.public_id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      currentLevel: row.current_level,
      categoryName: row.category_name,
      categoryIcon: row.category_icon,
      areaText: row.area_text,
      areaTagName: row.area_tag_name,
      occurredAt: row.occurred_at,
      slaDueAt: row.sla_due_at,
      isAnonymous: row.is_anonymous,
      assignedToName: row.assigned_to_name,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
      closedAt: row.closed_at,
      closureNote: row.closure_note,
      isOwner,
    };
  }

  private serializeForAdmin(row: any) {
    const isAnon = row.is_anonymous === true;
    return {
      id: row.id,
      publicId: row.public_id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      currentLevel: row.current_level,
      categoryName: row.category_name,
      categoryIcon: row.category_icon,
      areaText: row.area_text,
      areaTagName: row.area_tag_name,
      occurredAt: row.occurred_at,
      slaDueAt: row.sla_due_at,
      isAnonymous: isAnon,
      assignedTo: row.assigned_to,
      assignedToName: row.assigned_to_name,
      flagged: row.flagged,
      flagReason: row.flag_reason,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
      closedAt: row.closed_at,
      closureNote: row.closure_note,
      // Zero PII if anonymous
      submitter: isAnon
        ? { fullName: 'Anonymous Resident', isAnonymous: true }
        : {
            id: row.submitter_user_id,
            fullName: row.submitter_name,
            username: row.submitter_username,
            flatNumber: row.flat_number,
            mobile: row.submitter_mobile,
          },
    };
  }

  async listGrievancesForResident(societyId: string, user: any, statusFilter?: string) {
    const anonKey = this.getAnonEncryptionKey();
    const blindIndex = generateBlindIndex(anonKey, societyId, user.userId);

    const res = await pool.query(
      `SELECT g.*, c.name_en as category_name, c.icon as category_icon,
              a.name as area_tag_name, u.full_name as assigned_to_name
       FROM grievance g
       LEFT JOIN category c ON g.category_id = c.id
       LEFT JOIN area_tag a ON g.area_tag_id = a.id
       LEFT JOIN app_user u ON g.assigned_to = u.id
       LEFT JOIN co_complainant cc ON g.id = cc.grievance_id AND cc.user_id = $2
       WHERE g.society_id = $1
         AND (g.submitter_user_id = $2 OR g.submitter_blind_index = $3 OR cc.id IS NOT NULL)
         ${statusFilter ? 'AND g.status = $4' : ''}
       ORDER BY g.created_at DESC;`,
      statusFilter ? [societyId, user.userId, blindIndex, statusFilter] : [societyId, user.userId, blindIndex]
    );

    return res.rows.map((r) => this.serializeForResident(r, true));
  }

  async listGrievancesForAdmin(
    societyId: string,
    user: any,
    filters: { status?: string; level?: number; urgent?: boolean; assignedToMe?: boolean }
  ) {
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const conditions: string[] = ['g.society_id = $1'];
    const values: any[] = [societyId];
    let idx = 2;

    if (!isSuperAdmin) {
      if (filters.assignedToMe) {
        conditions.push(`g.assigned_to = $${idx++}`);
        values.push(user.userId);
      }
    }

    if (filters.status) {
      conditions.push(`g.status = $${idx++}`);
      values.push(filters.status);
    }
    if (filters.level) {
      conditions.push(`g.current_level = $${idx++}`);
      values.push(filters.level);
    }
    if (filters.urgent) {
      conditions.push(`g.priority IN ('URGENT', 'EMERGENCY')`);
    }

    const res = await pool.query(
      `SELECT g.*, c.name_en as category_name, c.icon as category_icon,
              a.name as area_tag_name, r.full_name as assigned_to_name,
              sub.full_name as submitter_name, sub.username as submitter_username,
              sub.mobile as submitter_mobile, f.flat_number
       FROM grievance g
       LEFT JOIN category c ON g.category_id = c.id
       LEFT JOIN area_tag a ON g.area_tag_id = a.id
       LEFT JOIN app_user r ON g.assigned_to = r.id
       LEFT JOIN app_user sub ON g.submitter_user_id = sub.id
       LEFT JOIN flat f ON g.flat_id = f.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY
         CASE WHEN g.priority = 'EMERGENCY' THEN 1
              WHEN g.priority = 'URGENT' THEN 2
              ELSE 3 END,
         g.sla_due_at ASC;`,
      values
    );

    return res.rows.map((r) => this.serializeForAdmin(r));
  }

  async getGrievanceById(societyId: string, grievanceId: string, user: any) {
    const anonKey = this.getAnonEncryptionKey();
    const blindIndex = generateBlindIndex(anonKey, societyId, user.userId);

    const res = await pool.query(
      `SELECT g.*, c.name_en as category_name, c.icon as category_icon,
              a.name as area_tag_name, r.full_name as assigned_to_name,
              sub.full_name as submitter_name, sub.username as submitter_username,
              sub.mobile as submitter_mobile, f.flat_number
       FROM grievance g
       LEFT JOIN category c ON g.category_id = c.id
       LEFT JOIN area_tag a ON g.area_tag_id = a.id
       LEFT JOIN app_user r ON g.assigned_to = r.id
       LEFT JOIN app_user sub ON g.submitter_user_id = sub.id
       LEFT JOIN flat f ON g.flat_id = f.id
       WHERE g.society_id = $1 AND g.id = $2;`,
      [societyId, grievanceId]
    );

    if (res.rows.length === 0) throw new NotFoundException('Grievance not found');
    const row = res.rows[0];

    const isResident = user.role === 'RESIDENT';
    const isOwner =
      row.submitter_user_id === user.userId || row.submitter_blind_index === blindIndex;

    if (isResident && !isOwner) {
      // Check co-complainant
      const coRes = await pool.query(
        `SELECT id FROM co_complainant WHERE grievance_id = $1 AND user_id = $2;`,
        [grievanceId, user.userId]
      );
      if (coRes.rows.length === 0) {
        throw new ForbiddenException('You do not have access to this grievance');
      }
    }

    // Evidence
    const evidenceRes = await pool.query(
      `SELECT * FROM evidence WHERE grievance_id = $1 ORDER BY created_at ASC;`,
      [grievanceId]
    );
    const evidenceList = [];
    for (const ev of evidenceRes.rows) {
      const url = await this.storageService.getDownloadUrl(ev.storage_key, 900);
      evidenceList.push({
        id: ev.id,
        storageKey: ev.storage_key,
        mime: ev.mime,
        size: ev.size,
        downloadUrl: url,
        createdAt: ev.created_at,
      });
    }

    // Events (Resident gets only RESIDENT visibility; Admin gets all)
    const eventRes = await pool.query(
      `SELECT * FROM grievance_event
       WHERE grievance_id = $1 ${isResident ? "AND visibility = 'RESIDENT'" : ''}
       ORDER BY seq ASC;`,
      [grievanceId]
    );

    const base = isResident
      ? this.serializeForResident(row, isOwner)
      : this.serializeForAdmin(row);

    return {
      ...base,
      evidence: evidenceList,
      timeline: eventRes.rows,
    };
  }

  // ==========================================
  // 3. PUBLIC TRACKING (NO AUTH / CONSTANT TIME)
  // ==========================================
  async trackPublic(publicId: string, trackingCode: string) {
    const hashed = hashTrackingCode(trackingCode);

    const res = await pool.query(
      `SELECT g.id, g.public_id, g.title, g.status, g.current_level, g.sla_due_at,
              g.created_at, g.resolved_at, g.closed_at, c.name_en as category_name
       FROM grievance g
       LEFT JOIN category c ON g.category_id = c.id
       WHERE g.public_id = $1 AND g.tracking_code_hash = $2;`,
      [publicId.trim().toUpperCase(), hashed]
    );

    if (res.rows.length === 0) {
      throw new NotFoundException('No complaint found matching this Public ID and Tracking Code.');
    }

    const row = res.rows[0];
    return {
      publicId: row.public_id,
      title: row.title,
      categoryName: row.category_name,
      status: row.status,
      currentLevel: row.current_level,
      slaDueAt: row.sla_due_at,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
      closedAt: row.closed_at,
    };
  }

  // ==========================================
  // 4. WORKFLOW ACTIONS
  // ==========================================
  async addNote(societyId: string, grievanceId: string, user: any, dto: AddGrievanceNoteDto) {
    const isResident = user.role === 'RESIDENT';
    const visibility = isResident ? 'RESIDENT' : dto.isInternal ? 'INTERNAL' : 'RESIDENT';

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const seqRes = await client.query(
        `SELECT COALESCE(MAX(seq), 0) + 1 as next_seq FROM grievance_event WHERE grievance_id = $1;`,
        [grievanceId]
      );
      const nextSeq = Number(seqRes.rows[0].next_seq);

      await client.query(
        `INSERT INTO grievance_event (
          society_id, grievance_id, seq, type, actor_id, actor_role, visibility, payload
        ) VALUES ($1, $2, $3, 'NOTE_ADDED', $4, $5, $6, $7);`,
        [
          societyId,
          grievanceId,
          nextSeq,
          user.userId,
          user.role || 'RESIDENT',
          visibility,
          JSON.stringify({ note: dto.note }),
        ]
      );

      await client.query('COMMIT');

      this.gateway.emitToGrievance(grievanceId, 'grievance.updated', {
        id: grievanceId,
        action: 'NOTE_ADDED',
      });

      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async acknowledgeGrievance(societyId: string, grievanceId: string, user: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const gRes = await client.query(
        `SELECT * FROM grievance WHERE id = $1 AND society_id = $2 FOR UPDATE;`,
        [grievanceId, societyId]
      );
      if (gRes.rows.length === 0) throw new NotFoundException('Grievance not found');
      const g = gRes.rows[0];

      GrievanceStateMachine.assertValidTransition(g.status as GrievanceStatus, 'ACKNOWLEDGED');

      await client.query(
        `UPDATE grievance SET status = 'ACKNOWLEDGED', updated_at = NOW() WHERE id = $1;`,
        [grievanceId]
      );

      const seqRes = await client.query(
        `SELECT COALESCE(MAX(seq), 0) + 1 as next_seq FROM grievance_event WHERE grievance_id = $1;`,
        [grievanceId]
      );
      await client.query(
        `INSERT INTO grievance_event (
          society_id, grievance_id, seq, type, actor_id, actor_role, visibility, payload
        ) VALUES ($1, $2, $3, 'ACKNOWLEDGED', $4, $5, 'RESIDENT', '{}');`,
        [societyId, grievanceId, Number(seqRes.rows[0].next_seq), user.userId, user.role]
      );

      await this.auditService.append({
        societyId,
        actorId: user.userId,
        actorRole: user.role,
        action: 'GRIEVANCE_ACKNOWLEDGED',
        entityType: 'grievance',
        entityId: grievanceId,
      });

      await client.query('COMMIT');

      if (g.submitter_user_id) {
        await this.notificationsService.send({
          societyId,
          userId: g.submitter_user_id,
          title: `Grievance Acknowledged: ${g.public_id}`,
          message: `Your grievance has been acknowledged by the resolver.`,
          type: 'INFO',
          link: `/app/grievances/${grievanceId}`,
        });
      }

      this.gateway.emitToGrievance(grievanceId, 'grievance.updated', {
        id: grievanceId,
        status: 'ACKNOWLEDGED',
      });

      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateStatus(societyId: string, grievanceId: string, user: any, dto: UpdateGrievanceStatusDto) {
    if (dto.status === 'RESOLVED' && (!dto.closureNote || dto.closureNote.trim().length < 5)) {
      throw new BadRequestException('Mandatory closure note required when resolving a grievance.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const gRes = await client.query(
        `SELECT * FROM grievance WHERE id = $1 AND society_id = $2 FOR UPDATE;`,
        [grievanceId, societyId]
      );
      if (gRes.rows.length === 0) throw new NotFoundException('Grievance not found');
      const g = gRes.rows[0];

      GrievanceStateMachine.assertValidTransition(g.status as GrievanceStatus, dto.status);

      const updates: string[] = ['status = $1', 'updated_at = NOW()'];
      const values: any[] = [dto.status];
      let idx = 2;

      if (dto.status === 'RESOLVED') {
        updates.push(`resolved_at = NOW()`);
        updates.push(`closure_note = $${idx++}`);
        values.push(dto.closureNote);
      } else if (dto.status === 'CLOSED') {
        updates.push(`closed_at = NOW()`);
      }

      if (dto.assignedTo) {
        updates.push(`assigned_to = $${idx++}`);
        values.push(dto.assignedTo);
      }

      values.push(grievanceId);
      await client.query(`UPDATE grievance SET ${updates.join(', ')} WHERE id = $${idx};`, values);

      const seqRes = await client.query(
        `SELECT COALESCE(MAX(seq), 0) + 1 as next_seq FROM grievance_event WHERE grievance_id = $1;`,
        [grievanceId]
      );
      await client.query(
        `INSERT INTO grievance_event (
          society_id, grievance_id, seq, type, actor_id, actor_role, visibility, payload
        ) VALUES ($1, $2, $3, $4, $5, $6, 'RESIDENT', $7);`,
        [
          societyId,
          grievanceId,
          Number(seqRes.rows[0].next_seq),
          `STATUS_${dto.status}`,
          user.userId,
          user.role,
          JSON.stringify({ status: dto.status, note: dto.closureNote || null }),
        ]
      );

      await this.auditService.append({
        societyId,
        actorId: user.userId,
        actorRole: user.role,
        action: `GRIEVANCE_STATUS_${dto.status}`,
        entityType: 'grievance',
        entityId: grievanceId,
        before: { status: g.status },
        after: { status: dto.status, closureNote: dto.closureNote },
      });

      await client.query('COMMIT');

      if (g.submitter_user_id) {
        await this.notificationsService.send({
          societyId,
          userId: g.submitter_user_id,
          title: `Status Update: ${g.public_id}`,
          message: `Your grievance status changed to ${dto.status}.`,
          type: dto.status === 'RESOLVED' ? 'SUCCESS' : 'INFO',
          link: `/app/grievances/${grievanceId}`,
        });
      }

      this.gateway.emitToGrievance(grievanceId, 'grievance.updated', {
        id: grievanceId,
        status: dto.status,
      });

      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async requestInfo(societyId: string, grievanceId: string, user: any, dto: RequestInfoDto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const gRes = await client.query(
        `SELECT * FROM grievance WHERE id = $1 AND society_id = $2 FOR UPDATE;`,
        [grievanceId, societyId]
      );
      if (gRes.rows.length === 0) throw new NotFoundException('Grievance not found');
      const g = gRes.rows[0];

      GrievanceStateMachine.assertValidTransition(g.status as GrievanceStatus, 'PENDING_INFO');

      await client.query(
        `UPDATE grievance SET status = 'PENDING_INFO', updated_at = NOW() WHERE id = $1;`,
        [grievanceId]
      );

      const seqRes = await client.query(
        `SELECT COALESCE(MAX(seq), 0) + 1 as next_seq FROM grievance_event WHERE grievance_id = $1;`,
        [grievanceId]
      );
      await client.query(
        `INSERT INTO grievance_event (
          society_id, grievance_id, seq, type, actor_id, actor_role, visibility, payload
        ) VALUES ($1, $2, $3, 'INFO_REQUESTED', $4, $5, 'RESIDENT', $6);`,
        [
          societyId,
          grievanceId,
          Number(seqRes.rows[0].next_seq),
          user.userId,
          user.role,
          JSON.stringify({ question: dto.question }),
        ]
      );

      await client.query('COMMIT');

      if (g.submitter_user_id) {
        await this.notificationsService.send({
          societyId,
          userId: g.submitter_user_id,
          title: `Information Requested: ${g.public_id}`,
          message: `The resolver has requested more details: "${dto.question}"`,
          type: 'ALERT',
          link: `/app/grievances/${grievanceId}`,
        });
      }

      this.gateway.emitToGrievance(grievanceId, 'grievance.updated', {
        id: grievanceId,
        status: 'PENDING_INFO',
      });

      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async manualEscalate(societyId: string, grievanceId: string, user: any, dto: ManualEscalateDto) {
    const res = await pool.query(
      `SELECT current_level FROM grievance WHERE id = $1 AND society_id = $2;`,
      [grievanceId, societyId]
    );
    if (res.rows.length === 0) throw new NotFoundException('Grievance not found');
    if (res.rows[0].current_level >= 4) {
      throw new BadRequestException('Cannot manually escalate beyond Level 4 (Governing Body).');
    }

    const seqRes = await pool.query(
      `SELECT COALESCE(MAX(seq), 0) + 1 as next_seq FROM grievance_event WHERE grievance_id = $1;`,
      [grievanceId]
    );
    await pool.query(
      `INSERT INTO grievance_event (
        society_id, grievance_id, seq, type, actor_id, actor_role, visibility, payload
      ) VALUES ($1, $2, $3, 'ESCALATED', $4, $5, 'INTERNAL', $6);`,
      [
        societyId,
        grievanceId,
        Number(seqRes.rows[0].next_seq),
        user.userId,
        user.role,
        JSON.stringify({ reason: dto.reason, manual: true }),
      ]
    );

    const success = await this.escalationService.handleBreach(grievanceId, 'MANUAL', user.userId);
    return { success };
  }

  async assignGrievance(societyId: string, grievanceId: string, user: any, dto: GrievanceAssignDto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const gRes = await client.query(
        `SELECT * FROM grievance WHERE id = $1 AND society_id = $2 FOR UPDATE;`,
        [grievanceId, societyId]
      );
      if (gRes.rows.length === 0) throw new NotFoundException('Grievance not found');
      const g = gRes.rows[0];

      await client.query(
        `UPDATE grievance SET assigned_to = $1, updated_at = NOW() WHERE id = $2;`,
        [dto.assignedTo, grievanceId]
      );

      const seqRes = await client.query(
        `SELECT COALESCE(MAX(seq), 0) + 1 as next_seq FROM grievance_event WHERE grievance_id = $1;`,
        [grievanceId]
      );
      await client.query(
        `INSERT INTO grievance_event (
          society_id, grievance_id, seq, type, actor_id, actor_role, visibility, payload
        ) VALUES ($1, $2, $3, 'REASSIGNED', $4, $5, 'INTERNAL', $6);`,
        [
          societyId,
          grievanceId,
          Number(seqRes.rows[0].next_seq),
          user.userId,
          user.role,
          JSON.stringify({ assignedTo: dto.assignedTo, reason: dto.reason }),
        ]
      );

      await this.auditService.append({
        societyId,
        actorId: user.userId,
        actorRole: user.role,
        action: 'GRIEVANCE_REASSIGNED',
        entityType: 'grievance',
        entityId: grievanceId,
        before: { assignedTo: g.assigned_to },
        after: { assignedTo: dto.assignedTo, reason: dto.reason },
      });

      await client.query('COMMIT');

      await this.notificationsService.send({
        societyId,
        userId: dto.assignedTo,
        title: `Grievance Assigned: ${g.public_id}`,
        message: `You have been assigned to handle grievance "${g.title}".`,
        type: 'INFO',
        link: `/admin/grievances/${grievanceId}`,
      });

      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async flagGrievance(societyId: string, grievanceId: string, user: any, dto: GrievanceFlagDto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const gRes = await client.query(
        `SELECT * FROM grievance WHERE id = $1 AND society_id = $2 FOR UPDATE;`,
        [grievanceId, societyId]
      );
      if (gRes.rows.length === 0) throw new NotFoundException('Grievance not found');
      const g = gRes.rows[0];

      await client.query(
        `UPDATE grievance SET flagged = $1, flag_reason = $2, updated_at = NOW() WHERE id = $3;`,
        [dto.flagged, dto.reason || null, grievanceId]
      );

      const seqRes = await client.query(
        `SELECT COALESCE(MAX(seq), 0) + 1 as next_seq FROM grievance_event WHERE grievance_id = $1;`,
        [grievanceId]
      );
      await client.query(
        `INSERT INTO grievance_event (
          society_id, grievance_id, seq, type, actor_id, actor_role, visibility, payload
        ) VALUES ($1, $2, $3, 'FLAGGED', $4, $5, 'INTERNAL', $6);`,
        [
          societyId,
          grievanceId,
          Number(seqRes.rows[0].next_seq),
          user.userId,
          user.role,
          JSON.stringify({ flagged: dto.flagged, reason: dto.reason }),
        ]
      );

      await this.auditService.append({
        societyId,
        actorId: user.userId,
        actorRole: user.role,
        action: dto.flagged ? 'GRIEVANCE_FLAGGED' : 'GRIEVANCE_UNFLAGGED',
        entityType: 'grievance',
        entityId: grievanceId,
        before: { flagged: g.flagged, flagReason: g.flag_reason },
        after: { flagged: dto.flagged, flagReason: dto.reason },
      });

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async appealGrievance(societyId: string, grievanceId: string, user: any, dto: GrievanceAppealDto) {
    await pool.query(
      `INSERT INTO appeal (society_id, grievance_id, reason)
       VALUES ($1, $2, $3);`,
      [societyId, grievanceId, dto.reason]
    );

    const success = await this.escalationService.handleBreach(grievanceId, 'APPEAL', user.userId);
    return { success };
  }

  async reopenGrievance(societyId: string, grievanceId: string, user: any) {
    const res = await pool.query(
      `SELECT resolved_at FROM grievance WHERE id = $1 AND society_id = $2;`,
      [grievanceId, societyId]
    );
    if (res.rows.length === 0) throw new NotFoundException('Grievance not found');
    const resolvedAt = res.rows[0].resolved_at;
    if (!resolvedAt) throw new BadRequestException('Grievance is not resolved yet.');

    const diffDays = (Date.now() - new Date(resolvedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      throw new BadRequestException('Grievance can only be reopened within 7 days of resolution.');
    }

    return this.updateStatus(societyId, grievanceId, user, { status: 'REOPENED' });
  }

  async rateGrievance(societyId: string, grievanceId: string, user: any, dto: GrievanceRateDto) {
    const res = await pool.query(
      `INSERT INTO rating (society_id, grievance_id, stars, comment, tags)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (grievance_id)
       DO UPDATE SET stars = EXCLUDED.stars, comment = EXCLUDED.comment, tags = EXCLUDED.tags
       RETURNING *;`,
      [societyId, grievanceId, dto.stars, dto.comment || null, JSON.stringify(dto.tags || [])]
    );

    await this.auditService.append({
      societyId,
      actorId: user.userId,
      actorRole: user.role,
      action: 'GRIEVANCE_RATED',
      entityType: 'grievance',
      entityId: grievanceId,
      before: null,
      after: { stars: dto.stars, comment: dto.comment, tags: dto.tags },
    });

    return res.rows[0];
  }

  async remindResolver(societyId: string, grievanceId: string, user: any) {
    const res = await pool.query(
      `SELECT g.id, g.public_id, g.title, g.assigned_to, g.created_at, s.value as remind_after_hours
       FROM grievance g
       LEFT JOIN society_setting s ON g.society_id = s.society_id AND s.key = 'remind_after_hours'
       WHERE g.id = $1 AND g.society_id = $2;`,
      [grievanceId, societyId]
    );
    if (res.rows.length === 0) throw new NotFoundException('Grievance not found');
    const g = res.rows[0];

    const minHours = Number(g.remind_after_hours || 24);
    const diffHours = (Date.now() - new Date(g.created_at).getTime()) / (1000 * 60 * 60);
    if (diffHours < minHours) {
      throw new BadRequestException(`Reminder can only be sent after ${minHours} hours of submission.`);
    }

    // Check rate limit: max 1 reminder per 24 hours
    const recentReminder = await pool.query(
      `SELECT id FROM grievance_event
       WHERE grievance_id = $1 AND type = 'RESIDENT_REMINDER'
         AND created_at > NOW() - INTERVAL '24 HOURS';`,
      [grievanceId]
    );
    if (recentReminder.rows.length > 0) {
      throw new ConflictException('A reminder was already sent in the last 24 hours.');
    }

    const seqRes = await pool.query(
      `SELECT COALESCE(MAX(seq), 0) + 1 as next_seq FROM grievance_event WHERE grievance_id = $1;`,
      [grievanceId]
    );
    await pool.query(
      `INSERT INTO grievance_event (
        society_id, grievance_id, seq, type, actor_id, actor_role, visibility, payload
      ) VALUES ($1, $2, $3, 'RESIDENT_REMINDER', $4, 'RESIDENT', 'RESIDENT', '{}');`,
      [societyId, grievanceId, Number(seqRes.rows[0].next_seq), user.userId]
    );

    if (g.assigned_to) {
      await this.notificationsService.send({
        societyId,
        userId: g.assigned_to,
        title: `Resident Follow-Up: ${g.public_id}`,
        message: `Resident requested an urgent update on "${g.title}".`,
        type: 'WARNING',
        link: `/admin/grievances/${grievanceId}`,
      });
    }

    return { success: true, message: 'Reminder sent to assigned resolver.' };
  }

  // ==========================================
  // 5. BREAK-GLASS IDENTITY REVEAL (SUPER_ADMIN)
  // ==========================================
  async revealIdentity(societyId: string, grievanceId: string, user: any, dto: RevealIdentityDto) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only the Super Administrator can invoke the identity reveal break-glass.');
    }

    if (!dto.reason || dto.reason.trim().length < 30) {
      throw new BadRequestException('Legal justification must be at least 30 characters.');
    }

    // 1. Fetch encrypted identity
    const anonRes = await pool.query(
      `SELECT encrypted_submitter FROM anonymous_identity
       WHERE grievance_id = $1 AND society_id = $2;`,
      [grievanceId, societyId]
    );

    if (anonRes.rows.length === 0) {
      throw new NotFoundException('No anonymous identity record found for this grievance.');
    }

    const anonKey = this.getAnonEncryptionKey();
    const decrypted = decryptSubmitter(anonRes.rows[0].encrypted_submitter, anonKey);

    // 2. Insert into identity_reveal table
    await pool.query(
      `INSERT INTO identity_reveal (society_id, grievance_id, revealed_by, reason)
       VALUES ($1, $2, $3, $4);`,
      [societyId, grievanceId, user.userId, dto.reason.trim()]
    );

    // 3. Cryptographic audit log (NEVER log decrypted values)
    await this.auditService.append({
      societyId,
      actorId: user.userId,
      actorRole: 'SUPER_ADMIN',
      action: 'IDENTITY_REVEALED',
      entityType: 'grievance',
      entityId: grievanceId,
      after: {
        reason: dto.reason.trim(),
        revealedAt: new Date().toISOString(),
      },
    });

    // 4. Send high-priority in-app alert to all GOVERNING_BODY members and CHAIRMAN
    const leadersRes = await pool.query(
      `SELECT id FROM app_user
       WHERE society_id = $1 AND role IN ('GOVERNING_BODY', 'CHAIRMAN') AND status = 'ACTIVE';`,
      [societyId]
    );

    for (const leader of leadersRes.rows) {
      await this.notificationsService.send({
        societyId,
        userId: leader.id,
        title: '🚨 SECURITY NOTICE: Anonymous Identity Revealed',
        message: `Super Admin revealed anonymous identity for grievance ${grievanceId}. Reason: "${dto.reason}"`,
        type: 'ALERT',
        link: `/admin/audit`,
      });
    }

    return {
      success: true,
      identity: decrypted,
    };
  }

  // ==========================================
  // 6. DRAFTS
  // ==========================================
  async saveDraft(societyId: string, userId: string, payload: any) {
    await pool.query(
      `INSERT INTO grievance_draft (user_id, society_id, payload, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW();`,
      [userId, societyId, JSON.stringify(payload)]
    );
    return { success: true };
  }

  async getDraft(societyId: string, userId: string) {
    const res = await pool.query(
      `SELECT payload, updated_at FROM grievance_draft
       WHERE user_id = $1 AND society_id = $2;`,
      [userId, societyId]
    );
    return res.rows[0]?.payload || null;
  }

  async cancelDraft(societyId: string, userId: string) {
    await pool.query(`DELETE FROM grievance_draft WHERE user_id = $1 AND society_id = $2;`, [
      userId,
      societyId,
    ]);
    return { success: true };
  }
}
