import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { pool } from '../../database/db';
import { AuditService } from '../audit/audit.service';
import { StaffCryptoService } from '../staff/staff-crypto.service';
import { VisitorPassService } from '../visitors/visitor-pass.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateVendorDto,
  CreateVendorTaskDto,
  AcceptDeclineTaskDto,
  ScheduleVisitDto,
  CompleteVendorTaskDto,
  ResidentConfirmTaskDto,
} from '@grievease/contracts';
import * as crypto from 'crypto';

@Injectable()
export class VendorsService {
  constructor(
    private auditService: AuditService,
    private cryptoService: StaffCryptoService,
    private passService: VisitorPassService,
    private notificationsService: NotificationsService,
  ) {}

  // ─── Vendor Management ──────────────────────────────────────────────────────

  async createVendor(societyId: string, actorId: string, dto: CreateVendorDto) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const encryptedPhone = this.cryptoService.encrypt(dto.phone);

      const res = await client.query(
        `INSERT INTO vendor (
          society_id, company_name, contact_person, phone_encrypted, category,
          service_provider_id, notes, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
        RETURNING *`,
        [
          societyId,
          dto.companyName,
          dto.contactPerson,
          encryptedPhone,
          dto.category,
          dto.serviceProviderId || null,
          dto.notes || null,
        ],
      );

      const vendor = res.rows[0];

      // Audit log
      await this.auditService.append({
        societyId,
        actorId,
        action: 'VENDOR_CREATED',
        entityType: 'vendor',
        entityId: vendor.id,
        after: {
          companyName: vendor.company_name,
          category: vendor.category,
        },
      });

      return {
        ...vendor,
        phone: dto.phone,
      };
    } finally {
      client.release();
    }
  }

  async listVendors(societyId: string, status?: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let query = `SELECT v.*, u.username as account_username,
                          (SELECT COUNT(*) FROM vendor_task vt WHERE vt.vendor_id = v.id) as total_jobs,
                          (SELECT COUNT(*) FROM vendor_task vt WHERE vt.vendor_id = v.id AND vt.status = 'COMPLETED') as completed_jobs
                   FROM vendor v
                   LEFT JOIN app_user u ON v.user_id = u.id
                   WHERE v.society_id = $1`;
      const params: any[] = [societyId];

      if (status) {
        params.push(status);
        query += ` AND v.status = $${params.length}`;
      }

      query += ` ORDER BY v.company_name ASC`;
      const res = await client.query(query, params);

      return res.rows.map((row: any) => {
        let phone = '***';
        try {
          if (row.phone_encrypted) phone = this.cryptoService.decrypt(row.phone_encrypted);
        } catch {}
        return {
          ...row,
          phone,
        };
      });
    } finally {
      client.release();
    }
  }

  async getVendor(societyId: string, vendorId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT v.*, u.username as account_username
         FROM vendor v
         LEFT JOIN app_user u ON v.user_id = u.id
         WHERE v.id = $1 AND v.society_id = $2`,
        [vendorId, societyId],
      );

      if (res.rows.length === 0) throw new NotFoundException('Vendor not found');
      const row = res.rows[0];

      let phone = '***';
      try {
        if (row.phone_encrypted) phone = this.cryptoService.decrypt(row.phone_encrypted);
      } catch {}

      return {
        ...row,
        phone,
      };
    } finally {
      client.release();
    }
  }

  async updateVendor(societyId: string, actorId: string, vendorId: string, body: any) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const existing = await this.getVendor(societyId, vendorId);

      const updates: string[] = [];
      const values: any[] = [];
      let i = 1;

      if (body.companyName) {
        updates.push(`company_name = $${i++}`);
        values.push(body.companyName);
      }
      if (body.contactPerson) {
        updates.push(`contact_person = $${i++}`);
        values.push(body.contactPerson);
      }
      if (body.phone) {
        updates.push(`phone_encrypted = $${i++}`);
        values.push(this.cryptoService.encrypt(body.phone));
      }
      if (body.category) {
        updates.push(`category = $${i++}`);
        values.push(body.category);
      }
      if (body.status) {
        updates.push(`status = $${i++}`);
        values.push(body.status);
      }
      if (body.notes !== undefined) {
        updates.push(`notes = $${i++}`);
        values.push(body.notes);
      }

      if (updates.length === 0) return existing;

      values.push(vendorId, societyId);
      const res = await client.query(
        `UPDATE vendor
         SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${i++} AND society_id = $${i++}
         RETURNING *`,
        values,
      );

      await this.auditService.append({
        societyId,
        actorId,
        action: 'VENDOR_UPDATED',
        entityType: 'vendor',
        entityId: vendorId,
        after: res.rows[0],
      });

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  // ─── Task Management & Assignment ──────────────────────────────────────────

  async createTask(societyId: string, actorId: string, dto: CreateVendorTaskDto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Check vendor active
      const vendorRes = await client.query(
        `SELECT * FROM vendor WHERE id = $1 AND society_id = $2 AND status = 'ACTIVE'`,
        [dto.vendorId, societyId],
      );
      if (vendorRes.rows.length === 0) throw new BadRequestException('Selected vendor is not active');
      const vendor = vendorRes.rows[0];

      // If grievance linked, check grievance
      let flatId = dto.flatId || null;
      let areaText = dto.areaText || null;

      if (dto.grievanceId) {
        const gRes = await client.query(
          `SELECT g.*, f.flat_number, w.name as wing_name
           FROM grievance g
           LEFT JOIN flat f ON g.flat_id = f.id
           LEFT JOIN wing w ON f.wing_id = w.id
           WHERE g.id = $1 AND g.society_id = $2`,
          [dto.grievanceId, societyId],
        );
        if (gRes.rows.length > 0) {
          const g = gRes.rows[0];
          flatId = g.flat_id;
          areaText = g.wing_name ? `${g.wing_name} - ${g.flat_number}` : g.flat_number || 'Common Area';
        }
      }

      const taskRes = await client.query(
        `INSERT INTO vendor_task (
          society_id, vendor_id, grievance_id, flat_id, area_text, title,
          description, priority, assigned_by, expected_visit_from, expected_visit_to,
          share_contact_with_vendor, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ASSIGNED'
        )
        RETURNING *`,
        [
          societyId,
          dto.vendorId,
          dto.grievanceId || null,
          flatId,
          areaText,
          dto.title,
          dto.description,
          dto.priority || 'MEDIUM',
          actorId,
          dto.expectedVisitFrom || null,
          dto.expectedVisitTo || null,
          dto.shareContactWithVendor || false,
        ],
      );

      const task = taskRes.rows[0];

      // Append event
      await client.query(
        `INSERT INTO vendor_task_event (task_id, actor_id, action, notes)
         VALUES ($1, $2, 'ASSIGNED', $3)`,
        [task.id, actorId, `Task assigned to ${vendor.company_name}`],
      );

      // Audit log
      await this.auditService.append({
        societyId,
        actorId,
        action: 'VENDOR_TASK_ASSIGNED',
        entityType: 'vendor_task',
        entityId: task.id,
        after: {
          vendorId: dto.vendorId,
          title: dto.title,
          grievanceId: dto.grievanceId,
        },
      });

      await client.query('COMMIT');

      // In-app alert to vendor if user account exists
      if (vendor.user_id) {
        await this.notificationsService.send({
          societyId,
          userId: vendor.user_id,
          title: `New Work Order: ${task.title}`,
          message: `You have been assigned a work order. Please accept or decline within the response window.`,
          type: 'INFO',
          link: `/vendor/tasks/${task.id}`,
        });
      }

      return task;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listVendorTasks(societyId: string, filter: { vendorId?: string; status?: string; grievanceId?: string } = {}) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let query = `
        SELECT vt.*, v.company_name as vendor_company_name, v.category as vendor_category,
               f.flat_number, w.name as wing_name
        FROM vendor_task vt
        JOIN vendor v ON vt.vendor_id = v.id
        LEFT JOIN flat f ON vt.flat_id = f.id
        LEFT JOIN wing w ON f.wing_id = w.id
        WHERE vt.society_id = $1
      `;
      const params: any[] = [societyId];

      if (filter.vendorId) {
        params.push(filter.vendorId);
        query += ` AND vt.vendor_id = $${params.length}`;
      }
      if (filter.status) {
        params.push(filter.status);
        query += ` AND vt.status = $${params.length}`;
      }
      if (filter.grievanceId) {
        params.push(filter.grievanceId);
        query += ` AND vt.grievance_id = $${params.length}`;
      }

      query += ` ORDER BY vt.created_at DESC`;
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  // ─── Vendor Visibility Allow-List Enforcement ─────────────────────────────

  async getTaskForVendor(societyId: string, taskId: string, vendorUserId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Lookup vendor by user_id
      const vRes = await client.query(
        `SELECT id, company_name FROM vendor WHERE user_id = $1 AND society_id = $2`,
        [vendorUserId, societyId],
      );
      if (vRes.rows.length === 0) throw new ForbiddenException('Vendor account not found');
      const vendor = vRes.rows[0];

      const res = await client.query(
        `SELECT vt.*, f.flat_number, w.name as wing_name,
                g.is_anonymous, g.contact_phone_encrypted as resident_phone_encrypted
         FROM vendor_task vt
         LEFT JOIN flat f ON vt.flat_id = f.id
         LEFT JOIN wing w ON f.wing_id = w.id
         LEFT JOIN grievance g ON vt.grievance_id = g.id
         WHERE vt.id = $1 AND vt.society_id = $2 AND vt.vendor_id = $3`,
        [taskId, societyId, vendor.id],
      );

      if (res.rows.length === 0) throw new NotFoundException('Task not found or access denied');
      const t = res.rows[0];

      // Fetch task photos
      const photosRes = await client.query(
        `SELECT id, kind, storage_key, mime, size, created_at FROM vendor_task_photo WHERE task_id = $1`,
        [taskId],
      );

      // Fetch events
      const eventsRes = await client.query(
        `SELECT id, action, notes, created_at FROM vendor_task_event WHERE task_id = $1 ORDER BY created_at ASC`,
        [taskId],
      );

      // STRICT PRIVACY ALLOW-LIST:
      // NEVER resident's name, phone, anonymous status or identity.
      // For anonymous grievances: only area shown.
      // If resident opted in per task (share_contact_with_vendor = true) and NOT anonymous:
      let sharedContactPhone: string | null = null;
      if (t.share_contact_with_vendor && !t.is_anonymous && t.resident_phone_encrypted) {
        try {
          sharedContactPhone = this.cryptoService.decrypt(t.resident_phone_encrypted);
        } catch {}
      }

      return {
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        area: t.is_anonymous
          ? (t.area_text || 'Common Facility Area')
          : t.flat_number
          ? `${t.wing_name ? `${t.wing_name}-` : ''}${t.flat_number}`
          : t.area_text || 'Common Facility',
        preferredWindow: {
          from: t.expected_visit_from,
          to: t.expected_visit_to,
        },
        sharedContactPhone,
        startedAt: t.started_at,
        completedAt: t.completed_at,
        completionNote: t.completion_note,
        residentRating: t.resident_rating,
        photos: photosRes.rows,
        events: eventsRes.rows,
        createdAt: t.created_at,
      };
    } finally {
      client.release();
    }
  }

  // ─── Task State Machine ───────────────────────────────────────────────────

  async respondTask(societyId: string, taskId: string, vendorUserId: string, dto: AcceptDeclineTaskDto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const vRes = await client.query(
        `SELECT id, company_name FROM vendor WHERE user_id = $1 AND society_id = $2`,
        [vendorUserId, societyId],
      );
      if (vRes.rows.length === 0) throw new ForbiddenException('Vendor account not found');
      const vendor = vRes.rows[0];

      const tRes = await client.query(
        `SELECT * FROM vendor_task WHERE id = $1 AND society_id = $2 AND vendor_id = $3 FOR UPDATE`,
        [taskId, societyId, vendor.id],
      );
      if (tRes.rows.length === 0) throw new NotFoundException('Task not found');
      const task = tRes.rows[0];

      if (task.status !== 'ASSIGNED') {
        throw new BadRequestException(`Task is in ${task.status} status and cannot be accepted/declined.`);
      }

      const nextStatus = dto.action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';

      await client.query(
        `UPDATE vendor_task
         SET status = $1, decline_reason = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [nextStatus, dto.declineReason || null, taskId],
      );

      await client.query(
        `INSERT INTO vendor_task_event (task_id, actor_id, action, notes)
         VALUES ($1, $2, $3, $4)`,
        [taskId, vendorUserId, nextStatus, dto.declineReason || `Task ${nextStatus.toLowerCase()}`],
      );

      // Audit
      await this.auditService.append({
        societyId,
        actorId: vendorUserId,
        action: `VENDOR_TASK_${nextStatus}`,
        entityType: 'vendor_task',
        entityId: taskId,
      });

      await client.query('COMMIT');

      // If declined, notify assigner
      if (dto.action === 'DECLINE') {
        await this.notificationsService.send({
          societyId,
          userId: task.assigned_by,
          title: `Task Declined by Vendor: ${task.title}`,
          message: `Reason: ${dto.declineReason || 'No reason provided'}`,
          type: 'WARNING',
          link: `/admin/vendor-tasks`,
        });
      }

      return { status: nextStatus };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async scheduleVisit(societyId: string, taskId: string, vendorUserId: string, dto: ScheduleVisitDto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const vRes = await client.query(
        `SELECT id, company_name FROM vendor WHERE user_id = $1 AND society_id = $2`,
        [vendorUserId, societyId],
      );
      if (vRes.rows.length === 0) throw new ForbiddenException('Vendor account not found');
      const vendor = vRes.rows[0];

      const tRes = await client.query(
        `SELECT * FROM vendor_task WHERE id = $1 AND society_id = $2 AND vendor_id = $3 FOR UPDATE`,
        [taskId, societyId, vendor.id],
      );
      if (tRes.rows.length === 0) throw new NotFoundException('Task not found');
      const task = tRes.rows[0];

      // Auto-create Visitor Pass for the guard console (type VENDOR)
      const { code, codeHash } = await this.passService.generateGateCode(societyId);
      const passId = crypto.randomUUID();
      const serial = `VP-VEND-${Date.now().toString(36).toUpperCase()}`;

      const { tokenHash } = this.passService.generatePassToken({
        passId,
        societyId,
        serial,
        validTo: dto.expectedVisitTo,
        type: 'VENDOR',
      });

      const passRes = await client.query(
        `INSERT INTO visitor_pass (
          id, society_id, flat_id, host_user_id, type, visitor_name,
          purpose, guests_count, valid_from, valid_to, recurrence,
          max_entries, entries_used, code_hash, pass_code, token_hash, status
        ) VALUES (
          $1, $2, $3, $4, 'VENDOR', $5, $6, 1, $7, $8, 'ONCE',
          1, 0, $9, $10, $11, 'ACTIVE'
        )
        RETURNING *`,
        [
          passId,
          societyId,
          task.flat_id,
          task.assigned_by,
          vendor.company_name,
          `Vendor Task: ${task.title}`,
          dto.expectedVisitFrom,
          dto.expectedVisitTo,
          codeHash,
          code,
          tokenHash,
        ],
      );

      const pass = passRes.rows[0];

      // Update task
      await client.query(
        `UPDATE vendor_task
         SET status = 'VISIT_SCHEDULED',
             expected_visit_from = $1,
             expected_visit_to = $2,
             visitor_pass_id = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [dto.expectedVisitFrom, dto.expectedVisitTo, pass.id, taskId],
      );

      await client.query(
        `INSERT INTO vendor_task_event (task_id, actor_id, action, notes)
         VALUES ($1, $2, 'VISIT_SCHEDULED', $3)`,
        [taskId, vendorUserId, `Visit scheduled from ${dto.expectedVisitFrom} to ${dto.expectedVisitTo}`],
      );

      await client.query('COMMIT');

      return {
        status: 'VISIT_SCHEDULED',
        visitorPass: {
          id: pass.id,
          passCode: code,
          validFrom: dto.expectedVisitFrom,
          validTo: dto.expectedVisitTo,
        },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async completeTask(societyId: string, taskId: string, vendorUserId: string, dto: CompleteVendorTaskDto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const vRes = await client.query(
        `SELECT id, company_name FROM vendor WHERE user_id = $1 AND society_id = $2`,
        [vendorUserId, societyId],
      );
      if (vRes.rows.length === 0) throw new ForbiddenException('Vendor account not found');
      const vendor = vRes.rows[0];

      const tRes = await client.query(
        `SELECT * FROM vendor_task WHERE id = $1 AND society_id = $2 AND vendor_id = $3 FOR UPDATE`,
        [taskId, societyId, vendor.id],
      );
      if (tRes.rows.length === 0) throw new NotFoundException('Task not found');
      const task = tRes.rows[0];

      // Save photos
      if (dto.afterPhotoKey) {
        await client.query(
          `INSERT INTO vendor_task_photo (task_id, kind, storage_key, mime, size, sha256, scan_status, uploaded_by)
           VALUES ($1, 'AFTER', $2, 'image/jpeg', 1024, 'sha256placeholder', 'CLEAN', $3)`,
          [taskId, dto.afterPhotoKey, vendorUserId],
        );
      }
      if (dto.beforePhotoKey) {
        await client.query(
          `INSERT INTO vendor_task_photo (task_id, kind, storage_key, mime, size, sha256, scan_status, uploaded_by)
           VALUES ($1, 'BEFORE', $2, 'image/jpeg', 1024, 'sha256placeholder', 'CLEAN', $3)`,
          [taskId, dto.beforePhotoKey, vendorUserId],
        );
      }

      await client.query(
        `UPDATE vendor_task
         SET status = 'COMPLETED',
             completed_at = CURRENT_TIMESTAMP,
             completion_note = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [dto.completionNote, taskId],
      );

      await client.query(
        `INSERT INTO vendor_task_event (task_id, actor_id, action, notes)
         VALUES ($1, $2, 'COMPLETED', $3)`,
        [taskId, vendorUserId, dto.completionNote],
      );

      await client.query('COMMIT');

      // Prompt resident to confirm if grievance exists
      if (task.grievance_id) {
        const gRes = await client.query(`SELECT user_id FROM grievance WHERE id = $1`, [task.grievance_id]);
        if (gRes.rows[0]?.user_id) {
          await this.notificationsService.send({
            societyId,
            userId: gRes.rows[0].user_id,
            title: `Technician Completed Job: ${task.title}`,
            message: `Please inspect the work and confirm if the issue is Fixed or Not Fixed.`,
            type: 'INFO',
            link: `/app/grievances/${task.grievance_id}`,
          });
        }
      }

      return { status: 'COMPLETED' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async residentConfirmTask(societyId: string, taskId: string, residentUserId: string, dto: ResidentConfirmTaskDto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const tRes = await client.query(
        `SELECT vt.*, g.user_id as grievance_resident_id
         FROM vendor_task vt
         LEFT JOIN grievance g ON vt.grievance_id = g.id
         WHERE vt.id = $1 AND vt.society_id = $2 FOR UPDATE`,
        [taskId, societyId],
      );
      if (tRes.rows.length === 0) throw new NotFoundException('Task not found');
      const task = tRes.rows[0];

      if (dto.confirmation === 'NOT_FIXED') {
        // Reopen task and notify resolver
        await client.query(
          `UPDATE vendor_task
           SET status = 'DISPUTED',
               resident_confirmation = 'NOT_FIXED',
               reopen_reason = $1,
               resident_comment = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [dto.reopenReason || 'Resident marked task as Not Fixed', dto.comment || null, taskId],
        );

        await client.query(
          `INSERT INTO vendor_task_event (task_id, actor_id, action, notes)
           VALUES ($1, $2, 'DISPUTED', $3)`,
          [taskId, residentUserId, dto.reopenReason || 'Resident reported issue is NOT fixed.'],
        );

        // Notify assigner
        await this.notificationsService.send({
          societyId,
          userId: task.assigned_by,
          title: `Task Reopened by Resident: ${task.title}`,
          message: `Resident stated: "${dto.reopenReason || 'Issue not resolved'}"`,
          type: 'WARNING',
          link: `/admin/vendor-tasks`,
        });
      } else {
        // CONFIRMED
        await client.query(
          `UPDATE vendor_task
           SET status = 'RESIDENT_CONFIRMED',
               resident_confirmation = 'CONFIRMED',
               resident_rating = $1,
               resident_comment = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [dto.rating || 5, dto.comment || null, taskId],
        );

        await client.query(
          `INSERT INTO vendor_task_event (task_id, actor_id, action, notes)
           VALUES ($1, $2, 'RESIDENT_CONFIRMED', $3)`,
          [taskId, residentUserId, `Confirmed fixed with rating ${dto.rating || 5}/5`],
        );
      }

      await client.query('COMMIT');
      return { status: dto.confirmation === 'NOT_FIXED' ? 'DISPUTED' : 'RESIDENT_CONFIRMED' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─── Vendor Performance Analytics ──────────────────────────────────────────

  async getVendorPerformance(societyId: string, vendorId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const vendor = await this.getVendor(societyId, vendorId);

      const statsRes = await client.query(
        `SELECT
           COUNT(*) as total_jobs,
           COUNT(*) FILTER (WHERE status != 'DECLINED') as accepted_jobs,
           COUNT(*) FILTER (WHERE status = 'DECLINED') as declined_jobs,
           COUNT(*) FILTER (WHERE status IN ('COMPLETED', 'RESIDENT_CONFIRMED')) as completed_jobs,
           COUNT(*) FILTER (WHERE resident_confirmation = 'CONFIRMED') as resident_confirmed_jobs,
           COUNT(*) FILTER (WHERE status = 'DISPUTED' OR resident_confirmation = 'NOT_FIXED') as reopened_jobs,
           AVG(resident_rating) FILTER (WHERE resident_rating IS NOT NULL) as avg_rating,
           COUNT(resident_rating) as rating_count,
           AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/3600) FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL) as avg_completion_hours
         FROM vendor_task
         WHERE vendor_id = $1 AND society_id = $2`,
        [vendorId, societyId],
      );

      const s = statsRes.rows[0];
      const totalJobs = Number(s.total_jobs || 0);

      // Sample size rule: fewer than 5 jobs shows "not enough data"
      const hasEnoughData = totalJobs >= 5;

      return {
        vendorId,
        companyName: vendor.company_name,
        category: vendor.category,
        totalJobs,
        hasEnoughData,
        acceptanceRate: totalJobs > 0 ? Math.round((Number(s.accepted_jobs) / totalJobs) * 100) : null,
        confirmationRate: Number(s.completed_jobs) > 0
          ? Math.round((Number(s.resident_confirmed_jobs) / Number(s.completed_jobs)) * 100)
          : null,
        reopenRate: totalJobs > 0 ? Math.round((Number(s.reopened_jobs) / totalJobs) * 100) : null,
        avgRating: s.avg_rating ? Number(Number(s.avg_rating).toFixed(1)) : null,
        ratingCount: Number(s.rating_count || 0),
        avgCompletionHours: s.avg_completion_hours ? Number(Number(s.avg_completion_hours).toFixed(1)) : null,
      };
    } finally {
      client.release();
    }
  }
}
