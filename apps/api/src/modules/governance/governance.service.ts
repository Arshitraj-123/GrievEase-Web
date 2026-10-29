import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { pool } from '../../database/db';
import { AuditService } from '../audit/audit.service';
import {
  CategoryDto,
  AreaTagDto,
  GovernanceAssignmentDto,
  SlaConfigDto,
  ResolverLeaveDto,
  WorkingHoursDayDto,
} from '@grievease/contracts';

@Injectable()
export class GovernanceService {
  private readonly logger = new Logger(GovernanceService.name);

  constructor(private auditService: AuditService) {}

  // ==========================================
  // 1. CATEGORIES CRUD
  // ==========================================
  async getCategories(societyId: string, onlyActive: boolean = true) {
    const res = await pool.query(
      `SELECT * FROM category
       WHERE society_id = $1 ${onlyActive ? 'AND active = true' : ''}
       ORDER BY sort ASC, created_at ASC;`,
      [societyId]
    );
    return res.rows;
  }

  async saveCategory(societyId: string, dto: CategoryDto, actorId: string, actorRole: string) {
    let result: any;
    if (dto.id) {
      const res = await pool.query(
        `UPDATE category
         SET name_en = $1, name_hi = $2, name_mr = $3, icon = $4,
             requires_photo = $5, sort = $6, active = $7
         WHERE id = $8 AND society_id = $9
         RETURNING *;`,
        [dto.nameEn, dto.nameHi, dto.nameMr, dto.icon, dto.requiresPhoto, dto.sort, dto.active, dto.id, societyId]
      );
      if (res.rows.length === 0) throw new NotFoundException('Category not found');
      result = res.rows[0];
    } else {
      const res = await pool.query(
        `INSERT INTO category (society_id, name_en, name_hi, name_mr, icon, requires_photo, sort, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *;`,
        [societyId, dto.nameEn, dto.nameHi, dto.nameMr, dto.icon, dto.requiresPhoto, dto.sort, dto.active]
      );
      result = res.rows[0];
    }

    await this.auditService.append({
      societyId,
      actorId,
      actorRole,
      action: dto.id ? 'CATEGORY_UPDATED' : 'CATEGORY_CREATED',
      entityType: 'category',
      entityId: result.id,
      after: result,
    });

    return result;
  }

  // ==========================================
  // 2. AREA TAGS CRUD
  // ==========================================
  async getAreaTags(societyId: string) {
    const res = await pool.query(
      `SELECT * FROM area_tag WHERE society_id = $1 ORDER BY name ASC;`,
      [societyId]
    );
    return res.rows;
  }

  async saveAreaTag(societyId: string, dto: AreaTagDto, actorId: string, actorRole: string) {
    let result: any;
    if (dto.id) {
      const res = await pool.query(
        `UPDATE area_tag SET name = $1, qr_slug = $2 WHERE id = $3 AND society_id = $4 RETURNING *;`,
        [dto.name, dto.qrSlug.toLowerCase().trim(), dto.id, societyId]
      );
      if (res.rows.length === 0) throw new NotFoundException('Area tag not found');
      result = res.rows[0];
    } else {
      const res = await pool.query(
        `INSERT INTO area_tag (society_id, name, qr_slug)
         VALUES ($1, $2, $3)
         ON CONFLICT (society_id, qr_slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING *;`,
        [societyId, dto.name, dto.qrSlug.toLowerCase().trim()]
      );
      result = res.rows[0];
    }

    await this.auditService.append({
      societyId,
      actorId,
      actorRole,
      action: dto.id ? 'AREA_TAG_UPDATED' : 'AREA_TAG_CREATED',
      entityType: 'area_tag',
      entityId: result.id,
      after: result,
    });

    return result;
  }

  // ==========================================
  // 3. GOVERNANCE CHAIN & ASSIGNMENTS
  // ==========================================
  async getGovernanceChain(societyId: string) {
    // 1. Get 4 levels
    const levelsRes = await pool.query(
      `SELECT * FROM governance_level WHERE society_id = $1 ORDER BY level ASC;`,
      [societyId]
    );

    // 2. Get active assignments
    const assignmentsRes = await pool.query(
      `SELECT ga.*, u.full_name, u.username, u.member_id, u.role
       FROM governance_assignment ga
       JOIN app_user u ON ga.user_id = u.id
       WHERE ga.society_id = $1 AND (ga.active_to IS NULL OR ga.active_to > NOW())
       ORDER BY ga.level ASC, ga.is_primary DESC;`,
      [societyId]
    );

    // Detect vacancies: any level with 0 active assignments
    const activeLevelSet = new Set(assignmentsRes.rows.map((r: any) => r.level));
    const levelsWithVacancy = levelsRes.rows.map((lvl: any) => ({
      ...lvl,
      isVacant: !activeLevelSet.has(lvl.level),
      assignments: assignmentsRes.rows.filter((a: any) => a.level === lvl.level),
    }));

    return {
      levels: levelsWithVacancy,
      hasVacancies: levelsWithVacancy.some((l: any) => l.isVacant),
    };
  }

  async setGovernanceAssignment(
    societyId: string,
    dto: GovernanceAssignmentDto,
    actorId: string,
    actorRole: string
  ) {
    if (dto.isPrimary) {
      // Clear previous primary for this level
      await pool.query(
        `UPDATE governance_assignment
         SET is_primary = false
         WHERE society_id = $1 AND level = $2;`,
        [societyId, dto.level]
      );
    }

    const res = await pool.query(
      `INSERT INTO governance_assignment (society_id, level, user_id, is_primary)
       VALUES ($1, $2, $3, $4)
       RETURNING *;`,
      [societyId, dto.level, dto.userId, dto.isPrimary]
    );

    await this.auditService.append({
      societyId,
      actorId,
      actorRole,
      action: 'GOVERNANCE_ASSIGNMENT_CREATED',
      entityType: 'governance_assignment',
      entityId: res.rows[0].id,
      after: res.rows[0],
    });

    return res.rows[0];
  }

  // ==========================================
  // 4. SLA MATRIX CONFIG
  // ==========================================
  async getSlaConfig(societyId: string) {
    const res = await pool.query(
      `SELECT s.*, c.name_en as category_name
       FROM sla_config s
       LEFT JOIN category c ON s.category_id = c.id
       WHERE s.society_id = $1
       ORDER BY s.priority ASC, s.level ASC;`,
      [societyId]
    );
    return res.rows;
  }

  async updateSlaConfig(societyId: string, dtos: SlaConfigDto[], actorId: string, actorRole: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of dtos) {
        await client.query(
          `INSERT INTO sla_config (society_id, category_id, priority, level, hours)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (society_id, category_id, priority, level)
           DO UPDATE SET hours = EXCLUDED.hours, updated_at = NOW();`,
          [societyId, item.categoryId || null, item.priority, item.level, item.hours]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    await this.auditService.append({
      societyId,
      actorId,
      actorRole,
      action: 'SLA_CONFIG_UPDATED',
      entityType: 'sla_config',
      entityId: societyId,
      after: { updatedCount: dtos.length },
    });

    return { success: true };
  }

  // ==========================================
  // 5. RESOLVER LEAVE MANAGEMENT
  // ==========================================
  async getResolverLeaves(societyId: string) {
    const res = await pool.query(
      `SELECT rl.*, u.full_name, u.username, u.role
       FROM resolver_leave rl
       JOIN app_user u ON rl.user_id = u.id
       WHERE rl.society_id = $1
       ORDER BY rl.from_at DESC;`,
      [societyId]
    );
    return res.rows;
  }

  async createResolverLeave(
    societyId: string,
    dto: ResolverLeaveDto,
    actorId: string,
    actorRole: string,
    escalationTrigger?: (userId: string, societyId: string) => Promise<void>
  ) {
    const res = await pool.query(
      `INSERT INTO resolver_leave (society_id, user_id, from_at, to_at, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [societyId, dto.userId, dto.fromAt, dto.toAt, dto.reason]
    );

    await this.auditService.append({
      societyId,
      actorId,
      actorRole,
      action: 'RESOLVER_LEAVE_CREATED',
      entityType: 'resolver_leave',
      entityId: res.rows[0].id,
      after: res.rows[0],
    });

    // If leave starts immediately or is active now, trigger immediate escalation of assigned items
    const fromTime = new Date(dto.fromAt).getTime();
    const now = Date.now();
    if (fromTime <= now && escalationTrigger) {
      this.logger.log(`Leave started for resolver ${dto.userId}. Cascading active open grievances.`);
      await escalationTrigger(dto.userId, societyId);
    }

    return res.rows[0];
  }

  // ==========================================
  // 6. WORKING HOURS CONFIG
  // ==========================================
  async getWorkingHours(societyId: string) {
    const res = await pool.query(
      `SELECT * FROM working_hours WHERE society_id = $1 ORDER BY weekday ASC;`,
      [societyId]
    );
    return res.rows;
  }

  async updateWorkingHours(societyId: string, days: WorkingHoursDayDto[], actorId: string, actorRole: string) {
    for (const d of days) {
      await pool.query(
        `INSERT INTO working_hours (society_id, weekday, start_time, end_time, enabled)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (society_id, weekday)
         DO UPDATE SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, enabled = EXCLUDED.enabled;`,
        [societyId, d.weekday, d.startTime, d.endTime, d.enabled]
      );
    }

    await this.auditService.append({
      societyId,
      actorId,
      actorRole,
      action: 'WORKING_HOURS_UPDATED',
      entityType: 'working_hours',
      entityId: societyId,
      after: { days },
    });

    return { success: true };
  }

  // ==========================================
  // 7. SOCIETY SETTINGS (KEY/VALUE)
  // ==========================================
  async getSocietySettings(societyId: string): Promise<Record<string, string>> {
    const res = await pool.query(
      `SELECT key, value FROM society_setting WHERE society_id = $1;`,
      [societyId]
    );
    const map: Record<string, string> = {
      rate_limit_per_24h: '5',
      duplicate_window_days: '7',
      auto_close_hours: '48',
      remind_after_hours: '24',
      warn_before_hours: '12',
      emergency_bypass_to_level: '2',
      chairman_alert_minutes: '30',
      rating_required_before_autoclose: 'false',
      max_evidence: '10',
    };
    for (const r of res.rows) {
      map[r.key] = r.value;
    }
    return map;
  }

  async updateSocietySettings(
    societyId: string,
    settings: Record<string, string | number | boolean>,
    actorId: string,
    actorRole: string
  ) {
    for (const [k, v] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO society_setting (society_id, key, value)
         VALUES ($1, $2, $3)
         ON CONFLICT (society_id, key)
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`,
        [societyId, k, String(v)]
      );
    }

    await this.auditService.append({
      societyId,
      actorId,
      actorRole,
      action: 'SOCIETY_SETTINGS_UPDATED',
      entityType: 'society_setting',
      entityId: societyId,
      after: settings,
    });

    return { success: true };
  }
}
