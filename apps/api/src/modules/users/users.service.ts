import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { pool } from '../../database/db';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  generateActivationCode,
  sha256Hex,
} from '../../common/utils/security-crypto';
import { Role } from '@grievease/contracts';

@Injectable()
export class UsersService {
  constructor(
    private auditService: AuditService,
    private notificationsService: NotificationsService
  ) {}

  async listUsers(
    societyId: string,
    filters: { search?: string; role?: string; status?: string; wing?: string },
    page: number = 1,
    limit: number = 50
  ) {
    const offset = (page - 1) * limit;
    const conditions: string[] = ['u.society_id = $1'];
    const params: any[] = [societyId];
    let idx = 2;

    if (filters.search) {
      conditions.push(`(u.full_name ILIKE $${idx} OR u.username ILIKE $${idx} OR u.member_id ILIKE $${idx} OR u.mobile ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }

    if (filters.role) {
      conditions.push(`u.role = $${idx}`);
      params.push(filters.role);
      idx++;
    }

    if (filters.status) {
      conditions.push(`u.status = $${idx}`);
      params.push(filters.status);
      idx++;
    }

    if (filters.wing) {
      conditions.push(`w.name = $${idx}`);
      params.push(filters.wing);
      idx++;
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `
      SELECT COUNT(*) as total
      FROM app_user u
      LEFT JOIN flat f ON u.flat_id = f.id
      LEFT JOIN wing w ON f.wing_id = w.id
      WHERE ${whereClause};
    `;

    const dataQuery = `
      SELECT u.id, u.member_id, u.username, u.full_name, u.mobile, u.email,
             u.role, u.status, u.directory_visible, u.failed_login_attempts,
             u.locked_until, u.created_at, u.updated_at,
             f.flat_number, w.name as wing_name,
             (SELECT last_seen_at FROM device_session WHERE user_id = u.id ORDER BY last_seen_at DESC LIMIT 1) as last_seen_at
      FROM app_user u
      LEFT JOIN flat f ON u.flat_id = f.id
      LEFT JOIN wing w ON f.wing_id = w.id
      WHERE ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1};
    `;

    params.push(limit, offset);

    const [countRes, dataRes] = await Promise.all([
      pool.query(countQuery, params.slice(0, idx - 1)),
      pool.query(dataQuery, params),
    ]);

    return {
      items: dataRes.rows,
      total: Number(countRes.rows[0].total),
      page,
      limit,
    };
  }

  async getUserById(id: string, societyId: string) {
    const res = await pool.query(`
      SELECT u.id, u.member_id, u.username, u.full_name, u.mobile, u.email,
             u.role, u.status, u.directory_visible, u.created_at,
             f.id as flat_id, f.flat_number, w.name as wing_name,
             (SELECT COUNT(*) FROM device_session WHERE user_id = u.id AND revoked_at IS NULL AND expires_at > NOW()) as active_sessions_count
      FROM app_user u
      LEFT JOIN flat f ON u.flat_id = f.id
      LEFT JOIN wing w ON f.wing_id = w.id
      WHERE u.id = $1 AND u.society_id = $2;
    `, [id, societyId]);

    if (res.rows.length === 0) throw new NotFoundException('User not found');
    return res.rows[0];
  }

  async createUser(
    societyId: string,
    creatorId: string,
    dto: {
      fullName: string;
      username?: string;
      mobile: string;
      email?: string | null;
      role: Role;
      wing: string;
      flat: string;
      verifyDetail: string;
      directoryVisible?: boolean;
    }
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Check single active SUPER_ADMIN restriction
      if (dto.role === 'SUPER_ADMIN') {
        const saCheck = await client.query(`SELECT id FROM app_user WHERE role = 'SUPER_ADMIN' AND status = 'ACTIVE';`);
        if (saCheck.rows.length > 0) {
          throw new ConflictException('An active Super Admin already exists. Role cannot be directly assigned.');
        }
      }

      // Find or create flat
      let wingRes = await client.query(`SELECT id FROM wing WHERE society_id = $1 AND name = $2;`, [societyId, dto.wing]);
      if (wingRes.rows.length === 0) {
        wingRes = await client.query(`INSERT INTO wing (society_id, name) VALUES ($1, $2) RETURNING id;`, [societyId, dto.wing]);
      }
      const wingId = wingRes.rows[0].id;

      let flatRes = await client.query(`SELECT id FROM flat WHERE society_id = $1 AND wing_id = $2 AND flat_number = $3;`, [societyId, wingId, dto.flat]);
      if (flatRes.rows.length === 0) {
        flatRes = await client.query(`INSERT INTO flat (society_id, wing_id, flat_number) VALUES ($1, $2, $3) RETURNING id;`, [societyId, wingId, dto.flat]);
      }
      const flatId = flatRes.rows[0].id;

      // Generate unique Member ID if not given: e.g. GV-A101-R...
      const memberId = `GV-${dto.wing}${dto.flat}-${dto.role.slice(0, 3)}-${Date.now().toString().slice(-4)}`;
      const generatedUsername = dto.username || `${dto.fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${Date.now().toString().slice(-4)}`;

      // Insert User in INVITED status
      const userRes = await client.query(`
        INSERT INTO app_user (
          society_id, flat_id, member_id, username, full_name, mobile, email,
          role, status, directory_visible, must_change_password
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'INVITED', $9, true)
        RETURNING id, member_id, username, full_name, role;
      `, [
        societyId,
        flatId,
        memberId,
        generatedUsername,
        dto.fullName,
        dto.mobile,
        dto.email || null,
        dto.role,
        dto.directoryVisible || false,
      ]);

      const newUser = userRes.rows[0];

      // Generate unambiguous activation code (7-day expiry)
      const plainCode = generateActivationCode();
      const codeHash = sha256Hex(plainCode);
      const verifyHash = sha256Hex(dto.verifyDetail.trim().toLowerCase());
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await client.query(`
        INSERT INTO activation_code (
          user_id, code_hash, verify_detail_hash, expires_at, issued_by
        ) VALUES ($1, $2, $3, $4, $5);
      `, [newUser.id, codeHash, verifyHash, expiresAt, creatorId]);

      await this.auditService.append({
        societyId,
        actorId: creatorId,
        actorRole: 'SUPER_ADMIN',
        action: 'USER_CREATED',
        entityType: 'app_user',
        entityId: newUser.id,
        after: { username: newUser.username, role: newUser.role, memberId: newUser.member_id },
      });

      await client.query('COMMIT');

      return {
        user: newUser,
        activationCode: plainCode,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async reissueActivationCode(userId: string, societyId: string, adminId: string, verifyDetail?: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const userRes = await client.query(`
        SELECT u.id, u.username, u.full_name, f.flat_number
        FROM app_user u
        LEFT JOIN flat f ON u.flat_id = f.id
        WHERE u.id = $1 AND u.society_id = $2;
      `, [userId, societyId]);

      if (userRes.rows.length === 0) throw new NotFoundException('User not found');
      const user = userRes.rows[0];

      // Invalidate existing activation codes
      await client.query(`
        UPDATE activation_code SET consumed_at = NOW()
        WHERE user_id = $1 AND consumed_at IS NULL;
      `, [userId]);

      const plainCode = generateActivationCode();
      const codeHash = sha256Hex(plainCode);
      const verifyValue = verifyDetail || user.flat_number || 'VERIFY';
      const verifyHash = sha256Hex(verifyValue.trim().toLowerCase());
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await client.query(`
        INSERT INTO activation_code (user_id, code_hash, verify_detail_hash, expires_at, issued_by)
        VALUES ($1, $2, $3, $4, $5);
      `, [userId, codeHash, verifyHash, expiresAt, adminId]);

      // Ensure user status is INVITED
      await client.query(`UPDATE app_user SET status = 'INVITED', password_hash = NULL WHERE id = $1;`, [userId]);

      await this.auditService.append({
        societyId,
        actorId: adminId,
        actorRole: 'SUPER_ADMIN',
        action: 'ACTIVATION_CODE_REISSUED',
        entityType: 'app_user',
        entityId: userId,
        after: { expiresAt: expiresAt.toISOString() },
      });

      await client.query('COMMIT');

      return {
        success: true,
        activationCode: plainCode,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async changeRole(userId: string, societyId: string, adminId: string, newRole: Role) {
    if (newRole === 'SUPER_ADMIN') {
      throw new BadRequestException('Super Admin role must be transferred via /admin/super-admin-transfer');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const userRes = await client.query(`SELECT id, role, username FROM app_user WHERE id = $1 AND society_id = $2;`, [userId, societyId]);
      if (userRes.rows.length === 0) throw new NotFoundException('User not found');
      const user = userRes.rows[0];

      const oldRole = user.role;
      await client.query(`UPDATE app_user SET role = $1 WHERE id = $2;`, [newRole, userId]);

      // If transitioning to or from Admin role, revoke active sessions
      await client.query(`UPDATE device_session SET revoked_at = NOW() WHERE user_id = $1;`, [userId]);

      await this.auditService.append({
        societyId,
        actorId: adminId,
        actorRole: 'SUPER_ADMIN',
        action: 'USER_ROLE_CHANGED',
        entityType: 'app_user',
        entityId: userId,
        before: { role: oldRole },
        after: { role: newRole },
      });

      await client.query('COMMIT');
      return { success: true, message: `Role changed from ${oldRole} to ${newRole}` };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateUserStatus(userId: string, societyId: string, adminId: string, status: 'ACTIVE' | 'DISABLED') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const userRes = await client.query(`SELECT id, status, role FROM app_user WHERE id = $1 AND society_id = $2;`, [userId, societyId]);
      if (userRes.rows.length === 0) throw new NotFoundException('User not found');
      const user = userRes.rows[0];

      if (user.role === 'SUPER_ADMIN') {
        throw new BadRequestException('Cannot disable the Super Admin account');
      }

      await client.query(`UPDATE app_user SET status = $1 WHERE id = $2;`, [status, userId]);

      if (status === 'DISABLED') {
        await client.query(`UPDATE device_session SET revoked_at = NOW() WHERE user_id = $1;`, [userId]);
      }

      await this.auditService.append({
        societyId,
        actorId: adminId,
        actorRole: 'SUPER_ADMIN',
        action: status === 'DISABLED' ? 'USER_DISABLED' : 'USER_ENABLED',
        entityType: 'app_user',
        entityId: userId,
        before: { status: user.status },
        after: { status },
      });

      await client.query('COMMIT');
      return { success: true, status };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ==========================================
  // SUPER ADMIN TRANSFER WORKFLOW
  // ==========================================
  async nominateSuperAdmin(nomineeUserId: string, currentAdminId: string, societyId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const nomineeRes = await client.query(`
        SELECT id, username, full_name, status, role FROM app_user
        WHERE id = $1 AND society_id = $2;
      `, [nomineeUserId, societyId]);

      if (nomineeRes.rows.length === 0) throw new NotFoundException('Nominee user not found');
      const nominee = nomineeRes.rows[0];

      if (nominee.status !== 'ACTIVE') {
        throw new BadRequestException('Nominee must be an ACTIVE resident or member');
      }
      if (nominee.id === currentAdminId) {
        throw new BadRequestException('You are already the Super Admin');
      }

      // Expire previous pending transfers
      await client.query(`
        UPDATE super_admin_transfer
        SET status = 'CANCELLED'
        WHERE from_user = $1 AND status IN ('PENDING', 'ACCEPTED');
      `, [currentAdminId]);

      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
      const transferRes = await client.query(`
        INSERT INTO super_admin_transfer (from_user, to_user, status, expires_at)
        VALUES ($1, $2, 'PENDING', $3)
        RETURNING id;
      `, [currentAdminId, nominee.id, expiresAt]);

      await this.notificationsService.send({
        societyId,
        userId: nominee.id,
        title: '👑 SUPER ADMIN NOMINATION RECEIVED',
        message: 'You have been nominated as the new Super Admin. Please visit your profile or /admin/super-admin-transfer to review and accept.',
        type: 'ALERT',
      });

      await this.auditService.append({
        societyId,
        actorId: currentAdminId,
        actorRole: 'SUPER_ADMIN',
        action: 'SUPER_ADMIN_TRANSFER_NOMINATED',
        entityType: 'super_admin_transfer',
        entityId: transferRes.rows[0].id,
        after: { nomineeId: nominee.id, nomineeUsername: nominee.username, expiresAt: expiresAt.toISOString() },
      });

      await client.query('COMMIT');
      return { success: true, transferId: transferRes.rows[0].id, expiresAt: expiresAt.toISOString() };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async confirmSuperAdminTransfer(transferId: string, currentAdminId: string, demotedRole: Role = 'RESIDENT') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const transferRes = await client.query(`
        SELECT * FROM super_admin_transfer
        WHERE id = $1 AND from_user = $2 AND status = 'PENDING';
      `, [transferId, currentAdminId]);

      if (transferRes.rows.length === 0) {
        throw new NotFoundException('No pending nomination found for this transfer ID');
      }

      const transfer = transferRes.rows[0];
      if (new Date(transfer.expires_at) < new Date()) {
        await client.query(`UPDATE super_admin_transfer SET status = 'EXPIRED' WHERE id = $1;`, [transferId]);
        throw new BadRequestException('This transfer nomination has expired (72h limit).');
      }

      const toUserId = transfer.to_user;
      const toUserRes = await client.query(`SELECT id, username, full_name, society_id FROM app_user WHERE id = $1;`, [toUserId]);
      const toUser = toUserRes.rows[0];

      // Swap roles atomically
      // 1. Demote outgoing Super Admin
      await client.query(`UPDATE app_user SET role = $1 WHERE id = $2;`, [demotedRole, currentAdminId]);
      // 2. Promote nominee
      await client.query(`UPDATE app_user SET role = 'SUPER_ADMIN' WHERE id = $1;`, [toUserId]);

      // 3. Revoke all sessions & backup codes of outgoing admin
      await client.query(`UPDATE device_session SET revoked_at = NOW() WHERE user_id = $1;`, [currentAdminId]);
      await client.query(`DELETE FROM totp_backup_code WHERE user_id = $1;`, [currentAdminId]);

      // 4. Mark transfer COMPLETED
      await client.query(`
        UPDATE super_admin_transfer SET status = 'COMPLETED', completed_at = NOW() WHERE id = $1;
      `, [transferId]);

      // Audit and notify Governing Body
      await this.auditService.append({
        societyId: toUser.society_id,
        actorId: currentAdminId,
        actorRole: 'SUPER_ADMIN',
        action: 'SUPER_ADMIN_TRANSFER_COMPLETED',
        entityType: 'super_admin_transfer',
        entityId: transferId,
        before: { superAdmin: currentAdminId },
        after: { newSuperAdmin: toUserId, outgoingAdminDemotedRole: demotedRole },
      });

      await this.notificationsService.send({
        societyId: toUser.society_id,
        targetRole: 'GOVERNING_BODY',
        title: '👑 SUPER ADMIN ROLE TRANSFER COMPLETED',
        message: `Super Admin role successfully transferred to ${toUser.full_name} (${toUser.username}). Outgoing admin role set to ${demotedRole}.`,
        type: 'ALERT',
      });

      await client.query('COMMIT');
      return { success: true, message: `Super Admin transferred to ${toUser.username}` };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ==========================================
  // RECOVERY REQUESTS MANAGEMENT (ADMIN-ASSISTED)
  // ==========================================
  async listRecoveryRequests(societyId: string) {
    const res = await pool.query(`
      SELECT t.id, t.user_id, t.status, t.eligible_at, t.created_at, t.ip,
             u.full_name, u.username, u.member_id, f.flat_number
      FROM password_reset_ticket t
      JOIN app_user u ON t.user_id = u.id
      LEFT JOIN flat f ON u.flat_id = f.id
      WHERE u.society_id = $1 AND t.status = 'PENDING'
      ORDER BY t.created_at DESC;
    `, [societyId]);
    return res.rows;
  }

  async cancelRecoveryRequest(ticketId: string, adminId: string, societyId: string) {
    await pool.query(`
      UPDATE password_reset_ticket SET status = 'CANCELLED' WHERE id = $1;
    `, [ticketId]);

    await this.auditService.append({
      societyId,
      actorId: adminId,
      actorRole: 'SECRETARY',
      action: 'RECOVERY_REQUEST_CANCELLED',
      entityType: 'password_reset_ticket',
      entityId: ticketId,
    });

    return { success: true };
  }

  async approveRecoveryRequest(ticketId: string, adminId: string, societyId: string) {
    // Accelerate cooling-off delay after in-person verification
    await pool.query(`
      UPDATE password_reset_ticket
      SET eligible_at = NOW()
      WHERE id = $1 AND status = 'PENDING';
    `, [ticketId]);

    await this.auditService.append({
      societyId,
      actorId: adminId,
      actorRole: 'SECRETARY',
      action: 'RECOVERY_REQUEST_ACCELERATED_APPROVED',
      entityType: 'password_reset_ticket',
      entityId: ticketId,
      after: { verifiedInPerson: true },
    });

    return { success: true, message: 'Recovery ticket approved. User may reset password immediately.' };
  }

  // User Profile / Security Endpoints
  async getUserSessions(userId: string) {
    const res = await pool.query(`
      SELECT id, device_label, ip, user_agent, last_seen_at, created_at
      FROM device_session
      WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
      ORDER BY last_seen_at DESC;
    `, [userId]);
    return res.rows;
  }

  async revokeSession(userId: string, sessionId: string) {
    await pool.query(`
      UPDATE device_session SET revoked_at = NOW()
      WHERE id = $1 AND user_id = $2;
    `, [sessionId, userId]);
    return { success: true };
  }

  async revokeAllOtherSessions(userId: string, currentSessionId: string) {
    await pool.query(`
      UPDATE device_session SET revoked_at = NOW()
      WHERE user_id = $1 AND id != $2 AND revoked_at IS NULL;
    `, [userId, currentSessionId]);
    return { success: true };
  }
}
