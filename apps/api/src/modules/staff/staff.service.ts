import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { pool } from '../../database/db';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppStorageService } from '../storage/storage.service';
import { StaffCryptoService } from './staff-crypto.service';
import { StaffPassService } from './staff-pass.service';
import {
  RegisterStaffDto,
  LinkExistingStaffDto,
  StaffListItemDto,
  StaffDetailDto,
  MarkAttendanceDto,
  StaffAttendanceItemDto,
  VerifyStaffDto,
  BlockStaffDto,
  MergeStaffDto,
  CreateStaffReviewDto,
} from '@grievease/contracts';

@Injectable()
export class StaffService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StaffService.name);
  private purgeTimer: NodeJS.Timeout | null = null;

  constructor(
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    private storageService: AppStorageService,
    private cryptoService: StaffCryptoService,
    private passService: StaffPassService
  ) {}

  onModuleInit() {
    // Nightly retention job to purge ID proof images past retention period
    this.purgeTimer = setInterval(() => {
      this.purgeExpiredIdProofs().catch((err) =>
        this.logger.error(`Nightly ID proof purge error: ${err.message}`)
      );
    }, 24 * 60 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.purgeTimer) clearInterval(this.purgeTimer);
  }

  /**
   * Register staff member for a flat (with duplicate detection via phone blind index)
   */
  async registerStaff(
    societyId: string,
    userId: string,
    dto: RegisterStaffDto
  ): Promise<{ staffId: string; duplicatePrompt?: boolean; existingStaff?: any }> {
    const blindIndex = this.cryptoService.computePhoneBlindIndex(dto.mobile);
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // 1. Check for existing staff with same phone blind index in society
      const existingRes = await client.query(`
        SELECT id, full_name, staff_type, status FROM domestic_staff
        WHERE society_id = $1 AND phone_blind_index = $2;
      `, [societyId, blindIndex]);

      if (existingRes.rows.length > 0) {
        const existing = existingRes.rows[0];
        // Prompt resident to LINK to existing record
        return {
          staffId: existing.id,
          duplicatePrompt: true,
          existingStaff: {
            id: existing.id,
            fullName: existing.full_name,
            staffType: existing.staff_type,
            status: existing.status,
          },
        };
      }

      await client.query('BEGIN');

      const encryptedPhone = this.cryptoService.encrypt(dto.mobile);

      // Insert domestic staff record
      const insertRes = await client.query(`
        INSERT INTO domestic_staff (
          society_id, full_name, staff_type, phone_blind_index,
          phone_encrypted, photo_key, id_proof_key, id_proof_type,
          status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9)
        RETURNING id;
      `, [
        societyId,
        dto.fullName.trim(),
        dto.staffType,
        blindIndex,
        encryptedPhone,
        dto.photoKey || null,
        dto.idProofKey || null,
        dto.idProofType || null,
        userId,
      ]);

      const staffId = insertRes.rows[0].id;

      // Link staff to resident's flat
      await client.query(`
        INSERT INTO staff_flat_link (
          staff_id, flat_id, added_by, schedule, entry_allowed
        ) VALUES ($1, $2, $3, $4, TRUE);
      `, [staffId, dto.flatId, userId, JSON.stringify(dto.schedule)]);

      await client.query('COMMIT');

      // Audit Log
      await this.auditService.append({
        societyId,
        actorId: userId,
        actorRole: 'RESIDENT',
        action: 'STAFF_REGISTERED',
        entityType: 'DOMESTIC_STAFF',
        entityId: staffId,
        after: { fullName: dto.fullName, staffType: dto.staffType, flatId: dto.flatId },
      });

      // Notify Secretary & Committee of pending staff verification
      await this.notificationsService.send({
        societyId,
        targetRole: 'SECRETARY',
        title: 'New Domestic Staff Pending Verification',
        message: `${dto.fullName} (${dto.staffType}) registered. In-person ID check required.`,
        type: 'INFO',
        link: `/admin/staff/${staffId}`,
      });

      return { staffId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Link an existing verified staff member to resident's flat
   */
  async linkExistingStaff(
    societyId: string,
    userId: string,
    dto: LinkExistingStaffDto
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      await client.query(`
        INSERT INTO staff_flat_link (
          staff_id, flat_id, added_by, schedule, entry_allowed
        ) VALUES ($1, $2, $3, $4, TRUE)
        ON CONFLICT (staff_id, flat_id) DO UPDATE SET
          schedule = EXCLUDED.schedule,
          entry_allowed = TRUE;
      `, [dto.staffId, dto.flatId, userId, JSON.stringify(dto.schedule)]);

      await this.auditService.append({
        societyId,
        actorId: userId,
        actorRole: 'RESIDENT',
        action: 'STAFF_LINKED_TO_FLAT',
        entityType: 'STAFF_FLAT_LINK',
        entityId: dto.staffId,
        after: { flatId: dto.flatId },
      });

      return true;
    } finally {
      client.release();
    }
  }

  /**
   * Verify staff member (Secretary / Super Admin) & issue signed Pass
   */
  async verifyStaff(
    societyId: string,
    userId: string,
    staffId: string,
    dto: VerifyStaffDto
  ): Promise<{ success: boolean; passSerial?: string }> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      await client.query('BEGIN');

      const staffRes = await client.query(`
        SELECT full_name, staff_type FROM domestic_staff
        WHERE id = $1 AND society_id = $2;
      `, [staffId, societyId]);

      if (staffRes.rows.length === 0) {
        throw new NotFoundException('Staff member not found');
      }

      await client.query(`
        UPDATE domestic_staff
        SET status = $1, verified_by = $2, verified_at = NOW(), updated_at = NOW()
        WHERE id = $3 AND society_id = $4;
      `, [dto.status, userId, staffId, societyId]);

      let passSerial: string | undefined;

      if (dto.status === 'VERIFIED') {
        // Generate serial e.g. STF-2026-0042
        const year = new Date().getFullYear();
        const randCode = Math.floor(1000 + Math.random() * 9000);
        passSerial = `STF-${year}-${randCode}`;

        const validTo = new Date();
        validTo.setFullYear(validTo.getFullYear() + 1); // 1-year pass

        const { tokenHash } = this.passService.generatePassToken({
          staffId,
          serial: passSerial,
          societyId,
          validTo: validTo.toISOString(),
        });

        await client.query(`
          INSERT INTO staff_pass (
            staff_id, serial, token_hash, status, valid_from, valid_to, issued_by
          ) VALUES ($1, $2, $3, 'ACTIVE', NOW(), $4, $5);
        `, [staffId, passSerial, tokenHash, validTo, userId]);
      }

      await client.query('COMMIT');

      await this.auditService.append({
        societyId,
        actorId: userId,
        actorRole: 'ADMIN',
        action: dto.status === 'VERIFIED' ? 'STAFF_VERIFIED' : 'STAFF_REJECTED',
        entityType: 'DOMESTIC_STAFF',
        entityId: staffId,
        after: { status: dto.status, reason: dto.reason, passSerial },
      });

      return { success: true, passSerial };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Block / Suspend staff member (requires step-up and audit)
   */
  async blockStaff(
    societyId: string,
    userId: string,
    staffId: string,
    dto: BlockStaffDto
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      await client.query('BEGIN');

      await client.query(`
        UPDATE domestic_staff
        SET status = 'BLOCKED', block_reason = $1, updated_at = NOW()
        WHERE id = $2 AND society_id = $3;
      `, [dto.reason, staffId, societyId]);

      // Revoke any active passes immediately
      await client.query(`
        UPDATE staff_pass
        SET status = 'REVOKED'
        WHERE staff_id = $1 AND status = 'ACTIVE';
      `, [staffId]);

      await client.query('COMMIT');

      await this.auditService.append({
        societyId,
        actorId: userId,
        actorRole: 'ADMIN',
        action: 'STAFF_BLOCKED',
        entityType: 'DOMESTIC_STAFF',
        entityId: staffId,
        after: { reason: dto.reason },
      });

      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Unblock staff member
   */
  async unblockStaff(
    societyId: string,
    userId: string,
    staffId: string,
    reason: string
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      await client.query('BEGIN');

      await client.query(`
        UPDATE domestic_staff
        SET status = 'VERIFIED', block_reason = NULL, updated_at = NOW()
        WHERE id = $1 AND society_id = $2;
      `, [staffId, societyId]);

      // Re-issue pass
      const year = new Date().getFullYear();
      const randCode = Math.floor(1000 + Math.random() * 9000);
      const passSerial = `STF-${year}-${randCode}`;
      const validTo = new Date();
      validTo.setFullYear(validTo.getFullYear() + 1);

      const { tokenHash } = this.passService.generatePassToken({
        staffId,
        serial: passSerial,
        societyId,
        validTo: validTo.toISOString(),
      });

      await client.query(`
        INSERT INTO staff_pass (
          staff_id, serial, token_hash, status, valid_from, valid_to, issued_by
        ) VALUES ($1, $2, $3, 'ACTIVE', NOW(), $4, $5);
      `, [staffId, passSerial, tokenHash, validTo, userId]);

      await client.query('COMMIT');

      await this.auditService.append({
        societyId,
        actorId: userId,
        actorRole: 'ADMIN',
        action: 'STAFF_UNBLOCKED',
        entityType: 'DOMESTIC_STAFF',
        entityId: staffId,
        after: { reason, passSerial },
      });

      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Merge duplicate staff records (audited)
   */
  async mergeStaff(societyId: string, userId: string, dto: MergeStaffDto): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      await client.query('BEGIN');

      // Move flat links from secondary to primary
      await client.query(`
        UPDATE staff_flat_link
        SET staff_id = $1
        WHERE staff_id = $2
        ON CONFLICT (staff_id, flat_id) DO NOTHING;
      `, [dto.primaryStaffId, dto.secondaryStaffId]);

      // Move attendance from secondary to primary
      await client.query(`
        UPDATE staff_attendance
        SET staff_id = $1
        WHERE staff_id = $2;
      `, [dto.primaryStaffId, dto.secondaryStaffId]);

      // Mark secondary as BLOCKED / MERGED
      await client.query(`
        UPDATE domestic_staff
        SET status = 'BLOCKED', block_reason = $1, updated_at = NOW()
        WHERE id = $2 AND society_id = $3;
      `, [`Merged into staff record ${dto.primaryStaffId}. Reason: ${dto.reason}`, dto.secondaryStaffId, societyId]);

      await client.query('COMMIT');

      await this.auditService.append({
        societyId,
        actorId: userId,
        actorRole: 'ADMIN',
        action: 'STAFF_MERGED',
        entityType: 'DOMESTIC_STAFF',
        entityId: dto.primaryStaffId,
        after: { secondaryStaffId: dto.secondaryStaffId, reason: dto.reason },
      });

      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get short-lived (60s) signed URL for ID proof image.
   * Viewable strictly by SECRETARY and SUPER_ADMIN. Every view is audited.
   */
  async getIdProofSignedUrl(
    societyId: string,
    userId: string,
    userRole: string,
    staffId: string
  ): Promise<{ signedUrl: string }> {
    if (!['SECRETARY', 'SUPER_ADMIN'].includes(userRole)) {
      throw new ForbiddenException('Only Secretary or Super Admin may view staff ID proofs.');
    }

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const staffRes = await client.query(`
        SELECT id_proof_key, id_proof_type, full_name
        FROM domestic_staff
        WHERE id = $1 AND society_id = $2;
      `, [staffId, societyId]);

      if (staffRes.rows.length === 0 || !staffRes.rows[0].id_proof_key) {
        throw new NotFoundException('ID proof image not found or has already been purged.');
      }

      const row = staffRes.rows[0];
      const signedUrl = await this.storageService.getDownloadUrl(row.id_proof_key, 60);

      // Audited view
      await this.auditService.append({
        societyId,
        actorId: userId,
        actorRole: userRole,
        action: 'STAFF_ID_PROOF_VIEWED',
        entityType: 'DOMESTIC_STAFF',
        entityId: staffId,
        after: { idProofType: row.id_proof_type },
      });

      return { signedUrl };
    } finally {
      client.release();
    }
  }

  /**
   * Nightly job: Purge ID proof images older than retention threshold after verification
   */
  async purgeExpiredIdProofs(): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Fetch societies and their retention setting (default 30 days)
      const socRes = await client.query(`
        SELECT s.id, COALESCE(ss.setting_value, '30')::int as retention_days
        FROM society s
        LEFT JOIN society_setting ss ON s.id = ss.society_id AND ss.setting_key = 'staff_id_retention_days';
      `);

      let totalPurged = 0;
      for (const soc of socRes.rows) {
        const expiredRes = await client.query(`
          SELECT id, id_proof_key FROM domestic_staff
          WHERE society_id = $1
            AND status = 'VERIFIED'
            AND id_proof_key IS NOT NULL
            AND verified_at <= NOW() - ($2 || ' days')::interval;
        `, [soc.id, soc.retention_days]);

        for (const row of expiredRes.rows) {
          // Delete from storage
          await this.storageService.deleteFile(row.id_proof_key).catch(() => {});

          // Nullify in DB
          await client.query(`
            UPDATE domestic_staff
            SET id_proof_key = NULL, updated_at = NOW()
            WHERE id = $1;
          `, [row.id]);

          await this.auditService.append({
            societyId: soc.id,
            actorId: 'SYSTEM_WORKER',
            actorRole: 'SYSTEM_WORKER',
            action: 'STAFF_ID_PROOF_PURGED_RETENTION',
            entityType: 'DOMESTIC_STAFF',
            entityId: row.id,
          });

          totalPurged++;
        }
      }

      if (totalPurged > 0) {
        this.logger.log(`🧹 Nightly ID proof retention job purged ${totalPurged} expired image(s).`);
      }
      return totalPurged;
    } finally {
      client.release();
    }
  }

  /**
   * Append-only attendance marking (corrections create new row with supersedes_id)
   */
  async markAttendance(
    _societyId: string,
    userId: string,
    dto: MarkAttendanceDto
  ): Promise<{ attendanceId: string }> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Check if an entry already exists for this staff, flat, and date
      const existingRes = await client.query(`
        SELECT id FROM staff_attendance
        WHERE staff_id = $1 AND flat_id = $2 AND date = $3
        ORDER BY created_at DESC LIMIT 1;
      `, [dto.staffId, dto.flatId, dto.date]);

      const supersedesId = existingRes.rows.length > 0 ? existingRes.rows[0].id : null;

      const inAt = dto.inAt ? new Date(`${dto.date}T${dto.inAt}`) : null;
      const outAt = dto.outAt ? new Date(`${dto.date}T${dto.outAt}`) : null;

      const insertRes = await client.query(`
        INSERT INTO staff_attendance (
          staff_id, flat_id, date, in_at, out_at, source, marked_by, note, supersedes_id
        ) VALUES ($1, $2, $3, $4, $5, 'MANUAL', $6, $7, $8)
        RETURNING id;
      `, [
        dto.staffId,
        dto.flatId,
        dto.date,
        inAt,
        outAt,
        userId,
        dto.note?.trim() || null,
        supersedesId,
      ]);

      return { attendanceId: insertRes.rows[0].id };
    } finally {
      client.release();
    }
  }

  /**
   * Get attendance for staff member in a flat for a given month (YYYY-MM)
   */
  async getStaffAttendance(
    staffId: string,
    flatId: string,
    month: string
  ): Promise<StaffAttendanceItemDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(`
        SELECT
          sa.id,
          sa.staff_id as "staffId",
          s.full_name as "staffName",
          f.flat_number as "flatNumber",
          sa.date::text as "date",
          sa.in_at::text as "inAt",
          sa.out_at::text as "outAt",
          sa.source,
          u.full_name as "markedByName",
          sa.note,
          (sa.supersedes_id IS NOT NULL) as "isCorrected"
        FROM staff_attendance sa
        JOIN domestic_staff s ON sa.staff_id = s.id
        JOIN flat f ON sa.flat_id = f.id
        JOIN app_user u ON sa.marked_by = u.id
        WHERE sa.staff_id = $1 AND sa.flat_id = $2
          AND sa.date >= ($3 || '-01')::date
          AND sa.date <= (($3 || '-01')::date + interval '1 month - 1 day')::date
        ORDER BY sa.date DESC, sa.created_at DESC;
      `, [staffId, flatId, month]);

      return res.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get resident's linked staff list
   */
  async getResidentStaffList(
    societyId: string,
    _userId: string,
    flatId: string | null
  ): Promise<StaffListItemDto[]> {
    if (!flatId) return [];

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(`
        SELECT
          s.id,
          s.full_name as "fullName",
          s.staff_type as "staffType",
          s.status,
          s.photo_key as "photoKey",
          (SELECT COUNT(*)::int FROM staff_flat_link sfl WHERE sfl.staff_id = s.id) as "linkedFlatsCount",
          sp.serial as "passSerial",
          (sp.id IS NOT NULL AND sp.status = 'ACTIVE') as "hasPass",
          s.created_at::text as "createdAt",
          sa.in_at::text as "inAt",
          sa.out_at::text as "outAt"
        FROM staff_flat_link link
        JOIN domestic_staff s ON link.staff_id = s.id
        LEFT JOIN staff_pass sp ON s.id = sp.staff_id AND sp.status = 'ACTIVE'
        LEFT JOIN staff_attendance sa ON s.id = sa.staff_id AND sa.flat_id = $2 AND sa.date = CURRENT_DATE
        WHERE link.flat_id = $2 AND s.society_id = $1
        ORDER BY s.full_name ASC;
      `, [societyId, flatId]);

      return res.rows.map((r) => {
        let todayStatus: 'PRESENT' | 'ABSENT' | 'CHECKED_IN' = 'ABSENT';
        if (r.inAt && !r.outAt) todayStatus = 'CHECKED_IN';
        else if (r.inAt && r.outAt) todayStatus = 'PRESENT';

        return {
          id: r.id,
          fullName: r.fullName,
          staffType: r.staffType,
          status: r.status,
          photoUrl: r.photoKey ? `/api/v1/storage/${r.photoKey}` : null,
          linkedFlatsCount: r.linkedFlatsCount,
          todayAttendanceStatus: todayStatus,
          inAt: r.inAt,
          outAt: r.outAt,
          hasPass: r.hasPass,
          passSerial: r.passSerial,
          createdAt: r.createdAt,
        };
      });
    } finally {
      client.release();
    }
  }

  /**
   * Get single staff member detail
   */
  async getStaffDetail(
    societyId: string,
    _userId: string,
    flatId: string | null,
    staffId: string
  ): Promise<StaffDetailDto> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const staffRes = await client.query(`
        SELECT
          s.id,
          s.full_name as "fullName",
          s.staff_type as "staffType",
          s.status,
          s.photo_key as "photoKey",
          s.id_proof_type as "idProofType",
          (s.id_proof_key IS NOT NULL) as "hasIdProofImage",
          s.created_at::text as "createdAt",
          sp.serial as "passSerial",
          (sp.id IS NOT NULL AND sp.status = 'ACTIVE') as "hasPass",
          sp.valid_to::text as "passValidTo"
        FROM domestic_staff s
        LEFT JOIN staff_pass sp ON s.id = sp.staff_id AND sp.status = 'ACTIVE'
        WHERE s.id = $1 AND s.society_id = $2;
      `, [staffId, societyId]);

      if (staffRes.rows.length === 0) {
        throw new NotFoundException('Staff member not found');
      }

      const s = staffRes.rows[0];

      // Schedule and linked flats
      const linksRes = await client.query(`
        SELECT f.id as "flatId", f.flat_number as "flatNumber", w.name as "wingName",
               sfl.entry_allowed as "entryAllowed", sfl.schedule
        FROM staff_flat_link sfl
        JOIN flat f ON sfl.flat_id = f.id
        JOIN wing w ON f.wing_id = w.id
        WHERE sfl.staff_id = $1;
      `, [staffId]);

      // Rating aggregate
      const revRes = await client.query(`
        SELECT COUNT(id)::int as "reviewCount", AVG(stars)::numeric(2,1) as "avgStars"
        FROM staff_review
        WHERE staff_id = $1 AND is_hidden = FALSE;
      `, [staffId]);
      const reviewCount = revRes.rows[0]?.reviewCount || 0;
      const avgStars = reviewCount >= 3 ? parseFloat(revRes.rows[0]?.avgStars) : null;

      // Reviews
      const revListRes = await client.query(`
        SELECT sr.id, sr.stars, sr.comment, sr.created_at::text as "createdAt"
        FROM staff_review sr
        WHERE sr.staff_id = $1 AND sr.is_hidden = FALSE
        ORDER BY sr.created_at DESC;
      `, [staffId]);

      // Pass token if exists
      let passData = null;
      if (s.hasPass) {
        const { token } = this.passService.generatePassToken({
          staffId: s.id,
          serial: s.passSerial,
          societyId,
          validTo: s.passValidTo,
        });
        passData = {
          serial: s.passSerial,
          token,
          validTo: s.passValidTo,
          qrData: token,
        };
      }

      // Schedule from resident's flat link or primary
      const currentFlatLink = linksRes.rows.find((l) => l.flatId === flatId) || linksRes.rows[0];
      const schedule = currentFlatLink && Array.isArray(currentFlatLink.schedule) ? currentFlatLink.schedule : [];

      return {
        id: s.id,
        fullName: s.fullName,
        staffType: s.staffType,
        status: s.status,
        photoUrl: s.photoKey ? `/api/v1/storage/${s.photoKey}` : null,
        linkedFlatsCount: linksRes.rows.length,
        todayAttendanceStatus: 'ABSENT',
        hasPass: s.hasPass,
        passSerial: s.passSerial,
        createdAt: s.createdAt,
        schedule,
        pass: passData,
        linkedFlats: linksRes.rows.map((l) => ({
          flatId: l.flatId,
          flatNumber: l.flatNumber,
          wingName: l.wingName,
          entryAllowed: l.entryAllowed,
        })),
        avgStars,
        reviewCount,
        reviews: revListRes.rows,
        idProofStatus: s.idProofType ? { type: s.idProofType, hasImage: s.hasIdProofImage } : null,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Admin staff list (PENDING first, then alphabetical)
   */
  async getAdminStaffList(societyId: string, statusFilter?: string): Promise<StaffListItemDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let sql = `
        SELECT
          s.id,
          s.full_name as "fullName",
          s.staff_type as "staffType",
          s.status,
          s.photo_key as "photoKey",
          (SELECT COUNT(*)::int FROM staff_flat_link sfl WHERE sfl.staff_id = s.id) as "linkedFlatsCount",
          sp.serial as "passSerial",
          (sp.id IS NOT NULL AND sp.status = 'ACTIVE') as "hasPass",
          s.created_at::text as "createdAt"
        FROM domestic_staff s
        LEFT JOIN staff_pass sp ON s.id = sp.staff_id AND sp.status = 'ACTIVE'
        WHERE s.society_id = $1
      `;
      const params: any[] = [societyId];

      if (statusFilter) {
        params.push(statusFilter);
        sql += ` AND s.status = $${params.length}`;
      }

      sql += `
        ORDER BY
          CASE WHEN s.status = 'PENDING' THEN 0 ELSE 1 END,
          s.full_name ASC;
      `;

      const res = await client.query(sql, params);
      return res.rows.map((r) => ({
        ...r,
        todayAttendanceStatus: 'ABSENT',
        photoUrl: r.photoKey ? `/api/v1/storage/${r.photoKey}` : null,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Submit review for staff member
   */
  async submitStaffReview(
    userId: string,
    staffId: string,
    dto: CreateStaffReviewDto
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      await client.query(`
        INSERT INTO staff_review (staff_id, flat_id, user_id, stars, comment, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (staff_id, user_id) DO UPDATE SET
          stars = EXCLUDED.stars,
          comment = EXCLUDED.comment,
          updated_at = NOW();
      `, [staffId, dto.flatId, userId, dto.stars, dto.comment?.trim() || null]);

      return true;
    } finally {
      client.release();
    }
  }

  /**
   * Helper to resolve resident's flatId from app_user
   */
  async getUserFlatId(userId: string): Promise<string | null> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query('SELECT flat_id FROM app_user WHERE id = $1;', [userId]);
      return res.rows[0]?.flat_id || null;
    } finally {
      client.release();
    }
  }
}
