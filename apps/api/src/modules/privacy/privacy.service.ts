import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { pool } from '../../database/db';
import { AuditService } from '../audit/audit.service';
import { StaffCryptoService } from '../staff/staff-crypto.service';
import {
  CreatePrivacyRequestDto,
  VerifyPrivacyRequestDto,
} from '@grievease/contracts';
import * as crypto from 'crypto';

@Injectable()
export class PrivacyService {
  constructor(
    private auditService: AuditService,
    private cryptoService: StaffCryptoService,
  ) {}

  // ─── Consent Tracking (DPDP Act 2023) ──────────────────────────────────────

  async recordConsent(userId: string, version: string, ip: string, userAgent?: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const ipHash = crypto.createHash('sha256').update(ip || '127.0.0.1').digest('hex');

      await client.query(
        `INSERT INTO user_consent (user_id, privacy_policy_version, ip_hash, user_agent)
         VALUES ($1, $2, $3, $4)`,
        [userId, version, ipHash, userAgent || null],
      );

      return { recorded: true, version };
    } finally {
      client.release();
    }
  }

  async checkLatestConsent(userId: string, currentVersion: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT privacy_policy_version, accepted_at
         FROM user_consent
         WHERE user_id = $1
         ORDER BY accepted_at DESC LIMIT 1`,
        [userId],
      );

      if (res.rows.length === 0) return { accepted: false, currentVersion };
      const latest = res.rows[0];
      return {
        accepted: latest.privacy_policy_version === currentVersion,
        latestAcceptedVersion: latest.privacy_policy_version,
        acceptedAt: latest.accepted_at,
        currentVersion,
      };
    } finally {
      client.release();
    }
  }

  // ─── Privacy Requests (Access, Correction, Deletion) ──────────────────────

  async submitPrivacyRequest(societyId: string, userId: string | null, dto: CreatePrivacyRequestDto) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const encryptedPhone = dto.requesterPhone ? this.cryptoService.encrypt(dto.requesterPhone) : null;

      const res = await client.query(
        `INSERT INTO privacy_request (
          society_id, user_id, type, requester_name, requester_email,
          requester_phone_encrypted, details, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'SUBMITTED')
        RETURNING id, type, requester_name, status, created_at`,
        [
          societyId,
          userId,
          dto.type,
          dto.requesterName,
          dto.requesterEmail || null,
          encryptedPhone,
          dto.details,
        ],
      );

      await this.auditService.append({
        societyId,
        actorId: userId || '00000000-0000-0000-0000-000000000000',
        action: 'PRIVACY_REQUEST_SUBMITTED',
        entityType: 'privacy_request',
        entityId: res.rows[0].id,
        after: { type: dto.type, requesterName: dto.requesterName },
      });

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async listPrivacyRequests(societyId: string, status?: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let query = `SELECT pr.*, u.username as registered_username
                   FROM privacy_request pr
                   LEFT JOIN app_user u ON pr.user_id = u.id
                   WHERE pr.society_id = $1`;
      const params: any[] = [societyId];

      if (status && status !== 'ALL') {
        params.push(status);
        query += ` AND pr.status = $${params.length}`;
      }

      query += ` ORDER BY pr.created_at DESC`;
      const res = await client.query(query, params);

      return res.rows.map((r) => {
        let phone = '';
        if (r.requester_phone_encrypted) {
          try {
            phone = this.cryptoService.decrypt(r.requester_phone_encrypted);
          } catch {}
        }
        return { ...r, phone };
      });
    } finally {
      client.release();
    }
  }

  async verifyPrivacyRequest(societyId: string, requestId: string, actorId: string, dto: VerifyPrivacyRequestDto) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `UPDATE privacy_request
         SET status = $1, verified_by = $2, verified_at = CURRENT_TIMESTAMP,
             outcome_note = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND society_id = $5
         RETURNING *`,
        [dto.status, actorId, dto.outcomeNote, requestId, societyId],
      );

      if (res.rows.length === 0) throw new NotFoundException('Privacy request not found');
      const req = res.rows[0];

      await this.auditService.append({
        societyId,
        actorId,
        action: `PRIVACY_REQUEST_${dto.status}`,
        entityType: 'privacy_request',
        entityId: requestId,
        after: { status: dto.status, note: dto.outcomeNote },
      });

      // If DELETION and VERIFIED, perform account anonymisation
      if (req.type === 'DELETION' && dto.status === 'VERIFIED' && req.user_id) {
        await this.anonymizeUserAccount(societyId, req.user_id, actorId);
      }

      return req;
    } finally {
      client.release();
    }
  }

  // ─── Self-Service Data Export ("Download My Data") ────────────────────────

  async generateUserDataExport(societyId: string, userId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // 1. Profile
      const uRes = await client.query(
        `SELECT u.id, u.username, u.full_name, u.role, u.created_at,
                f.flat_number, w.name as wing_name
         FROM app_user u
         LEFT JOIN flat f ON u.flat_id = f.id
         LEFT JOIN wing w ON f.wing_id = w.id
         WHERE u.id = $1 AND u.society_id = $2`,
        [userId, societyId],
      );
      if (uRes.rows.length === 0) throw new NotFoundException('User profile not found');
      const user = uRes.rows[0];

      // 2. Named grievances raised by user (EXCLUDE anonymous ones strictly!)
      const gRes = await client.query(
        `SELECT id, ticket_number, title, description, status, priority, created_at, resolved_at
         FROM grievance
         WHERE user_id = $1 AND society_id = $2 AND is_anonymous = false
         ORDER BY created_at DESC`,
        [userId, societyId],
      );

      // 3. Visitor passes
      const vRes = await client.query(
        `SELECT id, type, visitor_name, valid_from, valid_to, recurrence, status, created_at
         FROM visitor_pass
         WHERE host_user_id = $1 AND society_id = $2
         ORDER BY created_at DESC`,
        [userId, societyId],
      );

      // 4. Amenity bookings
      const bRes = await client.query(
        `SELECT b.id, a.name_en as amenity_name, b.slot_count, b.fee_paise, b.status, b.created_at
         FROM booking b
         JOIN amenity a ON b.amenity_id = a.id
         WHERE b.booked_by = $1 AND a.society_id = $2
         ORDER BY b.created_at DESC`,
        [userId, societyId],
      );

      // 5. Payments for flat
      const pRes = await client.query(
        `SELECT id, receipt_no, amount_paise, mode, received_on, status
         FROM payment
         WHERE flat_id = $1 AND society_id = $2
         ORDER BY received_on DESC`,
        [user.flat_id, societyId],
      );

      // 6. Messages
      const cRes = await client.query(
        `SELECT id, subject, status, created_at
         FROM conversation
         WHERE opened_by = $1 AND society_id = $2
         ORDER BY created_at DESC`,
        [userId, societyId],
      );

      // Audit export access
      await this.logSensitiveAccess(
        societyId,
        userId,
        user.role,
        'DATA_EXPORT',
        userId,
        'DOWNLOAD_MY_DATA',
        'User generated self-service personal data export under DPDP Act 2023',
      );

      return {
        exportDate: new Date().toISOString(),
        societyId,
        retentionPolicy: 'Export valid for 7 days per society DPDP guidelines',
        profile: user,
        grievancesRaisedNamedOnly: gRes.rows,
        visitorPasses: vRes.rows,
        amenityBookings: bRes.rows,
        flatPayments: pRes.rows,
        supportConversations: cRes.rows,
        note: 'Anonymous grievances are strictly omitted from this identity-linked export and can only be accessed using the original 16-character tracking code.',
      };
    } finally {
      client.release();
    }
  }

  // ─── Account Anonymisation (Right to Erasure) ─────────────────────────────

  async anonymizeUserAccount(societyId: string, userId: string, actorId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const anonHash = crypto.createHash('sha256').update(`${userId}:${Date.now()}`).digest('hex').slice(0, 10);
      const pseudonym = `ANON_USER_${anonHash}`;

      // Anonymize app_user table while keeping row ID so foreign keys don't break
      await client.query(
        `UPDATE app_user
         SET full_name = 'Deleted Resident',
             username = $1,
             password_hash = 'ACCOUNT_DELETED_INACCESSIBLE',
             totp_secret = NULL,
             backup_codes = NULL,
             phone_encrypted = NULL,
             status = 'DEACTIVATED',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND society_id = $3`,
        [pseudonym, userId, societyId],
      );

      // Purge visitor pass personal phone numbers
      await client.query(
        `UPDATE visitor_pass
         SET visitor_phone_encrypted = NULL
         WHERE host_user_id = $1 AND society_id = $2`,
        [userId, societyId],
      );

      // Audit the deletion without putting PII in the audit log
      await this.auditService.append({
        societyId,
        actorId,
        action: 'USER_ACCOUNT_ANONYMIZED',
        entityType: 'app_user',
        entityId: userId,
        after: { pseudonym, status: 'DEACTIVATED' },
      });

      await client.query('COMMIT');
      return { anonymized: true, pseudonym };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─── Sensitive Access Logging ─────────────────────────────────────────────

  async logSensitiveAccess(
    societyId: string,
    actorId: string,
    actorRole: string,
    targetType: string,
    targetId: string,
    action: string,
    reason?: string,
    ip?: string,
  ) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      await client.query(
        `INSERT INTO sensitive_access_log (
          society_id, actor_id, actor_role, target_type, target_id, action, reason, ip
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [societyId, actorId, actorRole, targetType, targetId, action, reason || null, ip || null],
      );
    } catch (err) {
      console.warn('Failed to record sensitive access log', err);
    } finally {
      client.release();
    }
  }

  async listSensitiveAccessLogs(societyId: string, limit: number = 100) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT sal.*, u.full_name as actor_name, u.username as actor_username
         FROM sensitive_access_log sal
         JOIN app_user u ON sal.actor_id = u.id
         WHERE sal.society_id = $1
         ORDER BY sal.created_at DESC LIMIT $2`,
        [societyId, limit],
      );
      return res.rows;
    } finally {
      client.release();
    }
  }
}

