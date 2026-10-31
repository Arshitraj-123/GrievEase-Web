import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import crypto from 'crypto';
import { pool } from '../../database/db';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  needsRehash,
} from '../../common/utils/password-policy';
import {
  encryptTotpSecret,
  decryptTotpSecret,
  generateRecoveryCodes,
  validateSecurityAnswer,
  hashSecurityAnswer,
  verifySecurityAnswer,
  verifyProofOfWork,
  sha256Hex,
} from '../../common/utils/security-crypto';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Role, isAdminRole } from '@grievease/contracts';

interface ChallengeItem {
  nonce: string;
  difficulty: number;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private challenges = new Map<string, ChallengeItem>();
  private ipFailures = new Map<string, { count: number; lastFailed: number }>();

  constructor(
    private auditService: AuditService,
    private notificationsService: NotificationsService
  ) {}

  private getJwtSecret(): string {
    return process.env.JWT_SECRET || 'dev_jwt_secret_must_be_changed_in_production_environment_32chars!';
  }

  // ==========================================
  // 1. PROOF OF WORK CHALLENGE GENERATION
  // ==========================================
  generateChallenge(): { nonce: string; difficulty: number; expiresAt: number } {
    const nonce = crypto.randomBytes(16).toString('hex');
    const difficulty = 4; // 4 leading hex zeroes (approx 65,536 hashes, solves in ~100-300ms)
    const expiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes

    this.challenges.set(nonce, { nonce, difficulty, expiresAt });

    // Clean up expired
    for (const [k, v] of this.challenges.entries()) {
      if (v.expiresAt < Date.now()) this.challenges.delete(k);
    }

    return { nonce, difficulty, expiresAt };
  }

  // ==========================================
  // 2. LOGIN & BRUTE FORCE DEFENSE
  // ==========================================
  async login(
    dto: { username: string; password: string; challengeNonce?: string; challengeSolution?: string },
    ip: string = '127.0.0.1',
    userAgent: string = 'Browser'
  ) {
    const client = await pool.connect();

    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Check IP failures
      const ipRecord = this.ipFailures.get(ip) || { count: 0, lastFailed: 0 };
      if (ipRecord.count >= 3) {
        if (!dto.challengeNonce || !dto.challengeSolution) {
          const ch = this.generateChallenge();
          throw new BadRequestException({
            code: 'CHALLENGE_REQUIRED',
            message: 'Proof of work challenge required due to multiple failed login attempts.',
            ...ch,
          });
        }

        const storedChallenge = this.challenges.get(dto.challengeNonce);
        if (!storedChallenge || storedChallenge.expiresAt < Date.now()) {
          throw new BadRequestException('Challenge expired. Please request a new challenge.');
        }

        const validPoW = verifyProofOfWork(
          dto.challengeNonce,
          dto.challengeSolution,
          storedChallenge.difficulty
        );
        this.challenges.delete(dto.challengeNonce);

        if (!validPoW) {
          throw new BadRequestException('Invalid proof of work solution.');
        }
      }

      // Fetch user
      const userRes = await client.query(`
        SELECT u.*, f.flat_number, s.name as society_name
        FROM app_user u
        LEFT JOIN flat f ON u.flat_id = f.id
        LEFT JOIN society s ON u.society_id = s.id
        WHERE u.username = $1;
      `, [dto.username]);

      const user = userRes.rows[0];

      // If user does not exist: run dummy constant-time verification
      if (!user) {
        await verifyPassword(null, dto.password);
        this.recordIpFailure(ip);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check lockout
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const remaining = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / (60 * 1000));
        throw new ForbiddenException(
          `Account is locked due to 5 consecutive failed login attempts. Try again in ${remaining} minute(s).`
        );
      }

      // Check user status
      if (user.status === 'LOCKED') {
        throw new ForbiddenException('Account is locked. Please contact your society secretary.');
      }
      if (user.status === 'DISABLED') {
        throw new ForbiddenException('Account is disabled. Please contact your society secretary.');
      }
      if (user.status === 'INVITED') {
        throw new ForbiddenException({
          code: 'ACCOUNT_INVITED',
          message: 'Account is not yet activated. Please activate your account using your one-time code.',
        });
      }

      // Verify password
      const isPasswordValid = await verifyPassword(user.password_hash, dto.password);

      if (!isPasswordValid) {
        const newFailCount = user.failed_login_attempts + 1;
        this.recordIpFailure(ip);

        if (newFailCount >= 5) {
          const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
          await client.query(`
            UPDATE app_user
            SET failed_login_attempts = $1, locked_until = $2
            WHERE id = $3;
          `, [newFailCount, lockUntil, user.id]);

          // Emit admin alert
          await this.notificationsService.send({
            societyId: user.society_id,
            targetRole: 'SECRETARY',
            title: '⚠️ ACCOUNT LOCK ALERT',
            message: `User '${user.username}' (${user.full_name}) was locked out after 5 consecutive failed login attempts.`,
            type: 'WARNING',
          });

          await this.auditService.append({
            societyId: user.society_id,
            actorId: user.id,
            actorRole: user.role,
            action: 'LOGIN_LOCKOUT',
            entityType: 'app_user',
            entityId: user.id,
            ip,
            device: userAgent,
            after: { lockedUntil: lockUntil.toISOString(), failedAttempts: newFailCount },
          });

          throw new ForbiddenException('Account locked for 15 minutes due to 5 failed login attempts.');
        } else {
          await client.query(`UPDATE app_user SET failed_login_attempts = $1 WHERE id = $2;`, [
            newFailCount,
            user.id,
          ]);

          await this.auditService.append({
            societyId: user.society_id,
            actorId: user.id,
            actorRole: user.role,
            action: 'LOGIN_FAILURE',
            entityType: 'app_user',
            entityId: user.id,
            ip,
            device: userAgent,
            after: { failedAttempts: newFailCount },
          });

          throw new UnauthorizedException('Invalid credentials');
        }
      }

      // Successful password check -> Reset failure count
      await client.query(`
        UPDATE app_user
        SET failed_login_attempts = 0, locked_until = NULL
        WHERE id = $1;
      `, [user.id]);
      this.ipFailures.delete(ip);

      // Automated Password Hash Upgrade (OWASP parameter migration / pepper rollout)
      if (needsRehash(user.password_hash)) {
        try {
          const upgradedHash = await hashPassword(dto.password);
          await client.query(`UPDATE app_user SET password_hash = $1 WHERE id = $2;`, [upgradedHash, user.id]);
        } catch {
          // Non-blocking hash migration failure
        }
      }

      // Check if Admin Role: Mandatory TOTP
      if (isAdminRole(user.role as Role)) {
        const totpRes = await client.query(`SELECT id, encrypted_secret FROM totp_secret WHERE user_id = $1;`, [user.id]);

        const tempToken = jwt.sign(
          { userId: user.id, role: user.role, societyId: user.society_id, username: user.username, type: '2FA_TEMP' },
          this.getJwtSecret(),
          { expiresIn: '5m' }
        );

        if (totpRes.rows.length === 0) {
          // Admin has not enrolled TOTP yet -> Return temp token for setup
          return {
            require2faSetup: true,
            tempToken,
            user: { id: user.id, role: user.role, username: user.username },
          };
        }

        return {
          require2fa: true,
          tempToken,
          user: { id: user.id, role: user.role, username: user.username },
        };
      }

      // Non-Admin: Issue full session
      const session = await this.createSession(user, ip, userAgent);

      await this.auditService.append({
        societyId: user.society_id,
        actorId: user.id,
        actorRole: user.role,
        action: 'LOGIN_SUCCESS',
        entityType: 'app_user',
        entityId: user.id,
        ip,
        device: userAgent,
      });

      return {
        success: true,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: {
          id: user.id,
          memberId: user.member_id,
          username: user.username,
          fullName: user.full_name,
          role: user.role,
          mustChangePassword: user.must_change_password,
          societyId: user.society_id,
          societyName: user.society_name,
        },
      };
    } finally {
      client.release();
    }
  }

  private recordIpFailure(ip: string) {
    const cur = this.ipFailures.get(ip) || { count: 0, lastFailed: 0 };
    this.ipFailures.set(ip, { count: cur.count + 1, lastFailed: Date.now() });
  }

  // ==========================================
  // 3. SESSION MANAGEMENT & REFRESH ROTATION
  // ==========================================
  async createSession(user: any, ip: string, userAgent: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Enforce max 5 concurrent sessions: Revoke oldest if >= 5
      const activeSessionsRes = await client.query(`
        SELECT id FROM device_session
        WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
        ORDER BY created_at ASC;
      `, [user.id]);

      if (activeSessionsRes.rows.length >= 5) {
        const toRevoke = activeSessionsRes.rows.slice(0, activeSessionsRes.rows.length - 4);
        for (const r of toRevoke) {
          await client.query(`UPDATE device_session SET revoked_at = NOW() WHERE id = $1;`, [r.id]);
        }
      }

      const familyId = crypto.randomUUID();
      const rawRefreshToken = crypto.randomBytes(40).toString('hex');
      const refreshTokenHash = sha256Hex(rawRefreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const sessionRes = await client.query(`
        INSERT INTO device_session (
          user_id, refresh_token_hash, family_id, device_label, ip, user_agent, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
      `, [user.id, refreshTokenHash, familyId, userAgent.substring(0, 50), ip, userAgent, expiresAt]);

      const sessionId = sessionRes.rows[0].id;

      // 15-minute access token
      const accessToken = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          societyId: user.society_id,
          username: user.username,
          sessionId,
        },
        this.getJwtSecret(),
        { expiresIn: '15m' }
      );

      return {
        sessionId,
        accessToken,
        refreshToken: `${sessionId}.${rawRefreshToken}`,
      };
    } finally {
      client.release();
    }
  }

  async refreshToken(cookieToken: string, ip: string, userAgent: string) {
    if (!cookieToken || !cookieToken.includes('.')) {
      throw new UnauthorizedException('Missing or malformed refresh token');
    }

    const parts = cookieToken.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new UnauthorizedException('Missing or malformed refresh token');
    }
    const sessionId = parts[0];
    const rawToken = parts[1];
    const tokenHash = sha256Hex(rawToken);

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const sessionRes = await client.query(`
        SELECT s.*, u.role, u.society_id, u.username
        FROM device_session s
        JOIN app_user u ON s.user_id = u.id
        WHERE s.id = $1;
      `, [sessionId]);

      if (sessionRes.rows.length === 0) {
        throw new UnauthorizedException('Session not found');
      }

      const session = sessionRes.rows[0];

      // Reuse Detection: If already revoked or hash mismatch -> revoke entire family!
      if (session.revoked_at !== null || session.refresh_token_hash !== tokenHash) {
        await client.query(`
          UPDATE device_session SET revoked_at = NOW()
          WHERE family_id = $1;
        `, [session.family_id]);

        await this.auditService.append({
          societyId: session.society_id,
          actorId: session.user_id,
          actorRole: session.role,
          action: 'TOKEN_REUSE_DETECTED',
          entityType: 'device_session',
          entityId: session.id,
          ip,
          device: userAgent,
        });

        throw new UnauthorizedException('Token reuse detected. All sessions terminated for security.');
      }

      // Check Inactivity (>15 minutes)
      const lastSeen = new Date(session.last_seen_at).getTime();
      if (Date.now() - lastSeen > 15 * 60 * 1000) {
        await client.query(`UPDATE device_session SET revoked_at = NOW() WHERE id = $1;`, [session.id]);
        throw new UnauthorizedException('Session expired due to 15-minute inactivity');
      }

      // Rotate Refresh Token
      const newRawToken = crypto.randomBytes(40).toString('hex');
      const newHash = sha256Hex(newRawToken);

      await client.query(`
        UPDATE device_session
        SET refresh_token_hash = $1, last_seen_at = NOW()
        WHERE id = $2;
      `, [newHash, session.id]);

      const newAccessToken = jwt.sign(
        {
          userId: session.user_id,
          role: session.role,
          societyId: session.society_id,
          username: session.username,
          sessionId: session.id,
        },
        this.getJwtSecret(),
        { expiresIn: '15m' }
      );

      return {
        accessToken: newAccessToken,
        refreshToken: `${session.id}.${newRawToken}`,
      };
    } finally {
      client.release();
    }
  }

  // ==========================================
  // 4. 2FA (TOTP) ENROLMENT & VERIFICATION
  // ==========================================
  async enrolTotp(tempToken: string) {
    const decoded = this.verifyTempToken(tempToken);
    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(decoded.username, 'GrievEase', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // Generate 10 backup codes
    const plainBackupCodes = generateRecoveryCodes(10);
    const backupCodeHashes = plainBackupCodes.map((c) => sha256Hex(c.replace('-', '')));

    const encryptedSecret = encryptTotpSecret(secret);

    return {
      totpToken: jwt.sign(
        { userId: decoded.userId, encryptedSecret, backupCodeHashes, type: 'TOTP_ENROL' },
        this.getJwtSecret(),
        { expiresIn: '15m' }
      ),
      secret,
      qrCode: qrCodeDataUrl,
      backupCodes: plainBackupCodes,
    };
  }

  async confirmTotpEnrolment(dto: { totpToken: string; code: string }, ip: string, userAgent: string) {
    let decoded: any;
    try {
      decoded = jwt.verify(dto.totpToken, this.getJwtSecret());
    } catch {
      throw new BadRequestException('TOTP setup session expired. Please start over.');
    }

    if (decoded.type !== 'TOTP_ENROL') {
      throw new BadRequestException('Invalid token type');
    }

    const decryptedSecret = decryptTotpSecret(decoded.encryptedSecret);
    const isValid = authenticator.check(dto.code, decryptedSecret);

    if (!isValid) {
      throw new BadRequestException('Invalid TOTP code. Please check your authenticator clock.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Store TOTP Secret
      await client.query(`
        INSERT INTO totp_secret (user_id, encrypted_secret, enabled_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) DO UPDATE SET encrypted_secret = EXCLUDED.encrypted_secret, enabled_at = NOW();
      `, [decoded.userId, decoded.encryptedSecret]);

      // Store Backup Codes
      await client.query(`DELETE FROM totp_backup_code WHERE user_id = $1;`, [decoded.userId]);
      for (const hash of decoded.backupCodeHashes) {
        await client.query(`
          INSERT INTO totp_backup_code (user_id, code_hash) VALUES ($1, $2);
        `, [decoded.userId, hash]);
      }

      // Activate user if invited
      const userRes = await client.query(`
        UPDATE app_user SET status = 'ACTIVE' WHERE id = $1
        RETURNING *;
      `, [decoded.userId]);

      const user = userRes.rows[0];
      const session = await this.createSession(user, ip, userAgent);

      await this.auditService.append({
        societyId: user.society_id,
        actorId: user.id,
        actorRole: user.role,
        action: 'TOTP_ENROLLED',
        entityType: 'app_user',
        entityId: user.id,
        ip,
        device: userAgent,
      });

      await client.query('COMMIT');

      return {
        success: true,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role,
        },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async verify2fa(dto: { tempToken: string; code: string }, ip: string, userAgent: string) {
    const decoded = this.verifyTempToken(dto.tempToken);

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const totpRes = await client.query(`SELECT encrypted_secret FROM totp_secret WHERE user_id = $1;`, [decoded.userId]);
      if (totpRes.rows.length === 0) {
        throw new BadRequestException('TOTP is not configured for this account');
      }

      const decrypted = decryptTotpSecret(totpRes.rows[0].encrypted_secret);
      let isValid = authenticator.check(dto.code, decrypted);

      // If TOTP check fails, check backup codes
      if (!isValid) {
        const cleanCode = dto.code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const codeHash = sha256Hex(cleanCode);

        const backupRes = await client.query(`
          SELECT id FROM totp_backup_code
          WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL;
        `, [decoded.userId, codeHash]);

        if (backupRes.rows.length > 0) {
          isValid = true;
          await client.query(`UPDATE totp_backup_code SET used_at = NOW() WHERE id = $1;`, [backupRes.rows[0].id]);

          await this.auditService.append({
            societyId: decoded.societyId,
            actorId: decoded.userId,
            actorRole: decoded.role,
            action: 'TOTP_BACKUP_CODE_USED',
            entityType: 'totp_backup_code',
            entityId: backupRes.rows[0].id,
            ip,
            device: userAgent,
          });
        }
      }

      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA code or backup code');
      }

      const userRes = await client.query(`SELECT * FROM app_user WHERE id = $1;`, [decoded.userId]);
      const user = userRes.rows[0];
      const session = await this.createSession(user, ip, userAgent);

      await this.auditService.append({
        societyId: user.society_id,
        actorId: user.id,
        actorRole: user.role,
        action: 'LOGIN_2FA_SUCCESS',
        entityType: 'app_user',
        entityId: user.id,
        ip,
        device: userAgent,
      });

      return {
        success: true,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role,
          memberId: user.member_id,
        },
      };
    } finally {
      client.release();
    }
  }

  private verifyTempToken(token: string): any {
    try {
      const decoded = jwt.verify(token, this.getJwtSecret()) as any;
      if (decoded.type !== '2FA_TEMP') throw new Error();
      return decoded;
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA session');
    }
  }

  // ==========================================
  // 5. STEP-UP ELEVATED CLAIM (5 MINUTES)
  // ==========================================
  async stepUp(userId: string, dto: { password: string; totpCode?: string }) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const userRes = await client.query(`SELECT * FROM app_user WHERE id = $1;`, [userId]);
      if (userRes.rows.length === 0) throw new UnauthorizedException('User not found');
      const user = userRes.rows[0];

      const passOk = await verifyPassword(user.password_hash, dto.password);
      if (!passOk) throw new UnauthorizedException('Invalid password for step-up verification');

      if (isAdminRole(user.role as Role)) {
        if (!dto.totpCode) throw new BadRequestException('TOTP code required for administrative step-up');

        const totpRes = await client.query(`SELECT encrypted_secret FROM totp_secret WHERE user_id = $1;`, [user.id]);
        if (totpRes.rows.length === 0) throw new BadRequestException('TOTP not configured');

        const secret = decryptTotpSecret(totpRes.rows[0].encrypted_secret);
        const validTotp = authenticator.check(dto.totpCode, secret);
        if (!validTotp) throw new UnauthorizedException('Invalid TOTP code for step-up');
      }

      // Generate 5-minute elevated step-up token
      const stepUpToken = jwt.sign(
        { userId: user.id, stepUp: true },
        this.getJwtSecret(),
        { expiresIn: '5m' }
      );

      return {
        success: true,
        stepUpToken,
        expiresInSeconds: 300,
      };
    } finally {
      client.release();
    }
  }

  // ==========================================
  // 6. ACTIVATION FLOW
  // ==========================================
  async activate(dto: { username: string; activationCode: string; verifyDetail: string }) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const userRes = await client.query(`
        SELECT u.*, f.flat_number FROM app_user u
        LEFT JOIN flat f ON u.flat_id = f.id
        WHERE u.username = $1 AND u.status = 'INVITED';
      `, [dto.username]);

      if (userRes.rows.length === 0) {
        throw new BadRequestException('No pending invitation found for this username.');
      }

      const user = userRes.rows[0];
      const codeHash = sha256Hex(dto.activationCode.toUpperCase());
      const verifyHash = sha256Hex(dto.verifyDetail.trim().toLowerCase());

      const codeRes = await client.query(`
        SELECT * FROM activation_code
        WHERE user_id = $1 AND consumed_at IS NULL AND expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1;
      `, [user.id]);

      if (codeRes.rows.length === 0) {
        throw new BadRequestException('Activation code expired or already consumed. Contact your administrator.');
      }

      const codeRow = codeRes.rows[0];
      if (codeRow.attempts >= 5) {
        throw new ForbiddenException('Activation code locked after 5 failed attempts. Request a fresh code from your secretary.');
      }

      if (codeRow.code_hash !== codeHash || codeRow.verify_detail_hash !== verifyHash) {
        await client.query(`UPDATE activation_code SET attempts = attempts + 1 WHERE id = $1;`, [codeRow.id]);
        throw new BadRequestException('Invalid activation code or verification detail (flat / DOB).');
      }

      // Mark code consumed
      await client.query(`UPDATE activation_code SET consumed_at = NOW() WHERE id = $1;`, [codeRow.id]);

      const activationToken = jwt.sign(
        { userId: user.id, role: user.role, societyId: user.society_id, type: 'ACTIVATION_TOKEN' },
        this.getJwtSecret(),
        { expiresIn: '30m' }
      );

      return {
        success: true,
        activationToken,
        role: user.role,
        isAdmin: isAdminRole(user.role as Role),
      };
    } finally {
      client.release();
    }
  }

  async setInitialPassword(dto: { activationToken: string; newPassword: string; confirmPassword?: string }) {
    if (dto.confirmPassword && dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(dto.activationToken, this.getJwtSecret());
    } catch {
      throw new BadRequestException('Activation token expired');
    }

    const check = validatePasswordStrength(dto.newPassword, { isAdmin: isAdminRole(decoded.role as Role) });
    if (!check.valid) {
      throw new BadRequestException(check.reason);
    }

    const hash = await hashPassword(dto.newPassword);

    await pool.query(`
      UPDATE app_user
      SET password_hash = $1, must_change_password = false, password_changed_at = NOW()
      WHERE id = $2;
    `, [hash, decoded.userId]);

    return { success: true, message: 'Password set successfully.' };
  }

  async setupSecurityQuestions(
    dto: { activationToken: string; questions: { ordinal: number; questionText: string; answer: string }[] },
    ip: string,
    userAgent: string
  ) {
    let decoded: any;
    try {
      decoded = jwt.verify(dto.activationToken, this.getJwtSecret());
    } catch {
      throw new BadRequestException('Activation token expired');
    }

    if (isAdminRole(decoded.role as Role)) {
      throw new ForbiddenException('Admin roles are not permitted to use security questions.');
    }

    if (!dto.questions || dto.questions.length !== 3) {
      throw new BadRequestException('Exactly 3 security questions must be configured.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const userRes = await client.query(`
        SELECT u.*, f.flat_number FROM app_user u
        LEFT JOIN flat f ON u.flat_id = f.id
        WHERE u.id = $1;
      `, [decoded.userId]);
      const user = userRes.rows[0];

      // Save questions and hashed answers
      await client.query(`DELETE FROM security_question WHERE user_id = $1;`, [user.id]);

      for (const q of dto.questions) {
        const val = validateSecurityAnswer(q.answer, {
          username: user.username,
          fullName: user.full_name,
          flat: user.flat_number,
        });
        if (!val.valid) {
          throw new BadRequestException(`Question #${q.ordinal}: ${val.reason}`);
        }

        const answerHash = await hashSecurityAnswer(val.normalized);
        await client.query(`
          INSERT INTO security_question (user_id, question_text, answer_hash, ordinal)
          VALUES ($1, $2, $3, $4);
        `, [user.id, q.questionText, answerHash, q.ordinal]);
      }

      // Generate 10 single-use recovery codes
      const plainCodes = generateRecoveryCodes(10);
      await client.query(`DELETE FROM recovery_code WHERE user_id = $1;`, [user.id]);
      for (const c of plainCodes) {
        const cHash = sha256Hex(c.replace('-', ''));
        await client.query(`INSERT INTO recovery_code (user_id, code_hash) VALUES ($1, $2);`, [user.id, cHash]);
      }

      // Mark user ACTIVE
      await client.query(`UPDATE app_user SET status = 'ACTIVE' WHERE id = $1;`, [user.id]);

      const session = await this.createSession(user, ip, userAgent);

      await this.auditService.append({
        societyId: user.society_id,
        actorId: user.id,
        actorRole: user.role,
        action: 'ACCOUNT_ACTIVATED',
        entityType: 'app_user',
        entityId: user.id,
        ip,
        device: userAgent,
      });

      await client.query('COMMIT');

      return {
        success: true,
        recoveryCodes: plainCodes,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role,
        },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ==========================================
  // 7. ACCOUNT RECOVERY (NON-ADMIN)
  // ==========================================
  async startRecovery(username: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const userRes = await client.query(`
        SELECT id, role FROM app_user WHERE username = $1 AND status = 'ACTIVE';
      `, [username]);

      if (userRes.rows.length === 0 || isAdminRole(userRes.rows[0].role as Role)) {
        // Return deterministic fake questions to prevent username enumeration
        return {
          questions: [
            { ordinal: 1, questionText: 'What was the name of your first elementary school?' },
            { ordinal: 2, questionText: 'In what town or city did your parents meet?' },
            { ordinal: 3, questionText: 'What is the name of your favourite childhood book?' },
          ],
        };
      }

      const qRes = await client.query(`
        SELECT ordinal, question_text FROM security_question
        WHERE user_id = $1 ORDER BY ordinal ASC;
      `, [userRes.rows[0].id]);

      if (qRes.rows.length !== 3) {
        throw new BadRequestException('Account recovery via security questions is not configured. Please use recovery codes or contact your secretary.');
      }

      return {
        questions: qRes.rows.map((r) => ({ ordinal: r.ordinal, questionText: r.question_text })),
      };
    } finally {
      client.release();
    }
  }

  async verifySecurityAnswers(dto: { username: string; answers: { ordinal: number; answer: string }[] }, ip: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const userRes = await client.query(`
        SELECT id, society_id, role, full_name FROM app_user
        WHERE username = $1 AND status = 'ACTIVE';
      `, [dto.username]);

      if (userRes.rows.length === 0 || isAdminRole(userRes.rows[0].role as Role)) {
        throw new BadRequestException('Security answer verification failed.');
      }

      const user = userRes.rows[0];
      const qRes = await client.query(`
        SELECT ordinal, answer_hash FROM security_question
        WHERE user_id = $1 ORDER BY ordinal ASC;
      `, [user.id]);

      if (qRes.rows.length !== 3) {
        throw new BadRequestException('Security questions not configured.');
      }

      let allCorrect = true;
      for (const q of qRes.rows) {
        const given = dto.answers.find((a) => a.ordinal === q.ordinal);
        if (!given) {
          allCorrect = false;
          break;
        }
        const normalized = validateSecurityAnswer(given.answer).normalized;
        const match = await verifySecurityAnswer(q.answer_hash, normalized);
        if (!match) {
          allCorrect = false;
          break;
        }
      }

      if (!allCorrect) {
        throw new BadRequestException('One or more security answers are incorrect.');
      }

      // Generate Reset Ticket with Cooling-Off Window (default 24h)
      const delayHours = Number(process.env.RECOVERY_DELAY_HOURS || 24);
      const eligibleAt = new Date(Date.now() + delayHours * 60 * 60 * 1000);
      const rawTicket = crypto.randomBytes(32).toString('hex');
      const ticketHash = sha256Hex(rawTicket);

      const ticketRes = await client.query(`
        INSERT INTO password_reset_ticket (user_id, ticket_hash, status, eligible_at, ip)
        VALUES ($1, $2, 'PENDING', $3, $4)
        RETURNING id;
      `, [user.id, ticketHash, eligibleAt, ip]);

      // Emit notice to active sessions and secretary
      await this.notificationsService.send({
        societyId: user.society_id,
        userId: user.id,
        title: '⚠️ PASSWORD RESET REQUEST INITIATED',
        message: `A password reset was requested via security questions. For your security, a ${delayHours}-hour cooling-off window is active. If this wasn't you, alert your secretary immediately.`,
        type: 'ALERT',
      });

      await this.notificationsService.send({
        societyId: user.society_id,
        targetRole: 'SECRETARY',
        title: 'PASSWORD RECOVERY REQUEST PENDING',
        message: `Resident ${user.full_name} (${dto.username}) initiated recovery. Ticket is held until ${eligibleAt.toLocaleString()}.`,
        type: 'INFO',
      });

      await this.auditService.append({
        societyId: user.society_id,
        actorId: user.id,
        actorRole: user.role,
        action: 'RECOVERY_REQUESTED',
        entityType: 'password_reset_ticket',
        entityId: ticketRes.rows[0].id,
        ip,
        after: { eligibleAt: eligibleAt.toISOString(), coolingOffHours: delayHours },
      });

      return {
        success: true,
        coolingOffHours: delayHours,
        eligibleAt: eligibleAt.toISOString(),
        ticketId: ticketRes.rows[0].id,
        resetToken: `${ticketRes.rows[0].id}.${rawTicket}`,
      };
    } finally {
      client.release();
    }
  }

  async useRecoveryCode(dto: { username: string; recoveryCode: string; newPassword: string }, ip: string, userAgent: string) {
    const cleanCode = dto.recoveryCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const codeHash = sha256Hex(cleanCode);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const userRes = await client.query(`
        SELECT id, society_id, role, username FROM app_user
        WHERE username = $1 AND status = 'ACTIVE';
      `, [dto.username]);

      if (userRes.rows.length === 0 || isAdminRole(userRes.rows[0].role as Role)) {
        throw new BadRequestException('Invalid recovery code.');
      }

      const user = userRes.rows[0];

      const codeRes = await client.query(`
        SELECT id FROM recovery_code
        WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL;
      `, [user.id, codeHash]);

      if (codeRes.rows.length === 0) {
        throw new BadRequestException('Invalid or already used recovery code.');
      }

      // Burn code
      await client.query(`UPDATE recovery_code SET used_at = NOW() WHERE id = $1;`, [codeRes.rows[0].id]);

      // Validate and set new password
      const check = validatePasswordStrength(dto.newPassword, { isAdmin: false, username: user.username });
      if (!check.valid) throw new BadRequestException(check.reason);

      const passHash = await hashPassword(dto.newPassword);
      await client.query(`
        UPDATE app_user
        SET password_hash = $1, password_changed_at = NOW(), must_change_password = false
        WHERE id = $2;
      `, [passHash, user.id]);

      // Revoke all existing sessions
      await client.query(`UPDATE device_session SET revoked_at = NOW() WHERE user_id = $1;`, [user.id]);

      // Generate a fresh set of 10 recovery codes
      const newCodes = generateRecoveryCodes(10);
      await client.query(`DELETE FROM recovery_code WHERE user_id = $1;`, [user.id]);
      for (const c of newCodes) {
        await client.query(`INSERT INTO recovery_code (user_id, code_hash) VALUES ($1, $2);`, [user.id, sha256Hex(c.replace('-', ''))]);
      }

      await this.auditService.append({
        societyId: user.society_id,
        actorId: user.id,
        actorRole: user.role,
        action: 'PASSWORD_RESET_RECOVERY_CODE',
        entityType: 'app_user',
        entityId: user.id,
        ip,
        device: userAgent,
      });

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Password successfully reset. All previous sessions terminated.',
        freshRecoveryCodes: newCodes,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async resetPasswordWithTicket(dto: { ticketToken: string; newPassword: string }, ip: string, userAgent: string) {
    const parts = dto.ticketToken.split('.');
    if (parts.length !== 2) {
      throw new BadRequestException('Invalid reset ticket token');
    }
    const ticketId = parts[0];
    const rawTicket = parts[1];
    if (!ticketId || !rawTicket) {
      throw new BadRequestException('Invalid reset ticket token');
    }
    const ticketHash = sha256Hex(rawTicket);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const ticketRes = await client.query(`
        SELECT t.*, u.username, u.society_id, u.role
        FROM password_reset_ticket t
        JOIN app_user u ON t.user_id = u.id
        WHERE t.id = $1 AND t.ticket_hash = $2 AND t.status = 'PENDING';
      `, [ticketId, ticketHash]);

      if (ticketRes.rows.length === 0) {
        throw new BadRequestException('Invalid or expired reset ticket.');
      }

      const ticket = ticketRes.rows[0];

      if (new Date(ticket.eligible_at) > new Date()) {
        throw new ForbiddenException(
          `Cooling-off delay active. Password reset becomes eligible at ${new Date(ticket.eligible_at).toISOString()}.`
        );
      }

      const check = validatePasswordStrength(dto.newPassword, { isAdmin: false, username: ticket.username });
      if (!check.valid) throw new BadRequestException(check.reason);

      const passHash = await hashPassword(dto.newPassword);
      await client.query(`
        UPDATE app_user
        SET password_hash = $1, password_changed_at = NOW(), must_change_password = false
        WHERE id = $2;
      `, [passHash, ticket.user_id]);

      // Burn ticket
      await client.query(`UPDATE password_reset_ticket SET status = 'USED', used_at = NOW() WHERE id = $1;`, [ticketId]);

      // Revoke all existing sessions
      await client.query(`UPDATE device_session SET revoked_at = NOW() WHERE user_id = $1;`, [ticket.user_id]);

      // Regenerate 10 recovery codes
      const newCodes = generateRecoveryCodes(10);
      await client.query(`DELETE FROM recovery_code WHERE user_id = $1;`, [ticket.user_id]);
      for (const c of newCodes) {
        await client.query(`INSERT INTO recovery_code (user_id, code_hash) VALUES ($1, $2);`, [ticket.user_id, sha256Hex(c.replace('-', ''))]);
      }

      await this.auditService.append({
        societyId: ticket.society_id,
        actorId: ticket.user_id,
        actorRole: ticket.role,
        action: 'PASSWORD_RESET_TICKET_COMPLETED',
        entityType: 'password_reset_ticket',
        entityId: ticketId,
        ip,
        device: userAgent,
      });

      await this.notificationsService.send({
        societyId: ticket.society_id,
        targetRole: 'SECRETARY',
        title: 'PASSWORD RESET COMPLETED',
        message: `User ${ticket.username} has completed password reset via security questions ticket.`,
        type: 'INFO',
      });

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Password reset successfully. All sessions revoked.',
        freshRecoveryCodes: newCodes,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ==========================================
  // 8. FIRST-RUN SUPER ADMIN BOOTSTRAP
  // ==========================================
  async getSetupStatus() {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const adminCheck = await client.query(`
        SELECT id FROM app_user WHERE role = 'SUPER_ADMIN' AND status = 'ACTIVE' LIMIT 1;
      `);
      if (adminCheck.rows.length > 0) return { available: false };

      const stateCheck = await client.query(`SELECT setup_completed_at, setup_token_expires_at FROM bootstrap_state WHERE id = 1;`);
      if (stateCheck.rows.length > 0 && stateCheck.rows[0].setup_completed_at) {
        return { available: false };
      }

      return { available: true };
    } finally {
      client.release();
    }
  }

  async setupFirstAdmin(dto: { setupToken: string; name: string; username: string; password: string }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Check if setup already complete
      const stateRes = await client.query(`SELECT * FROM bootstrap_state WHERE id = 1;`);
      if (stateRes.rows.length === 0 || stateRes.rows[0].setup_completed_at) {
        throw new NotFoundException('Setup endpoint not found or first-time setup has already been completed.');
      }

      const state = stateRes.rows[0];
      const tokenHash = sha256Hex(dto.setupToken);

      if (state.setup_token_hash !== tokenHash || new Date(state.setup_token_expires_at) < new Date()) {
        throw new UnauthorizedException('Invalid or expired setup token. Generate a new one with `pnpm admin:bootstrap`.');
      }

      // Password policy check
      const check = validatePasswordStrength(dto.password, { isAdmin: true, username: dto.username });
      if (!check.valid) throw new BadRequestException(check.reason);

      // Get or create root society
      let socRes = await client.query(`SELECT id FROM society LIMIT 1;`);
      let societyId: string;
      if (socRes.rows.length === 0) {
        const newSoc = await client.query(`
          INSERT INTO society (name, code, address, city, state, pincode)
          VALUES ('Root Community', 'ROOT', 'Administrative Headquarters', 'Metro', 'State', '100001')
          RETURNING id;
        `);
        societyId = newSoc.rows[0].id;
      } else {
        societyId = socRes.rows[0].id;
      }

      const passHash = await hashPassword(dto.password);

      // Create SUPER_ADMIN
      const userRes = await client.query(`
        INSERT INTO app_user (
          society_id, member_id, username, full_name, mobile, role, status,
          password_hash, must_change_password
        ) VALUES ($1, 'SA-01', $2, $3, '+910000000000', 'SUPER_ADMIN', 'ACTIVE', $4, false)
        RETURNING id, username, full_name, role;
      `, [societyId, dto.username, dto.name, passHash]);

      const user = userRes.rows[0];

      // Generate offline TOTP for Super Admin
      const secret = authenticator.generateSecret();
      const otpAuthUrl = authenticator.keyuri(user.username, 'GrievEase', secret);
      const qrCode = await QRCode.toDataURL(otpAuthUrl);
      const encryptedSecret = encryptTotpSecret(secret);

      await client.query(`
        INSERT INTO totp_secret (user_id, encrypted_secret, enabled_at)
        VALUES ($1, $2, NOW());
      `, [user.id, encryptedSecret]);

      // Generate 10 backup codes
      const plainBackupCodes = generateRecoveryCodes(10);
      for (const code of plainBackupCodes) {
        await client.query(`
          INSERT INTO totp_backup_code (user_id, code_hash)
          VALUES ($1, $2);
        `, [user.id, sha256Hex(code.replace('-', ''))]);
      }

      // Permanently seal /setup
      await client.query(`
        UPDATE bootstrap_state
        SET setup_completed_at = NOW(), setup_token_hash = NULL
        WHERE id = 1;
      `);

      await this.auditService.append({
        societyId,
        actorId: user.id,
        actorRole: 'SUPER_ADMIN',
        action: 'SUPER_ADMIN_BOOTSTRAP',
        entityType: 'app_user',
        entityId: user.id,
        after: { username: user.username, role: 'SUPER_ADMIN' },
      });

      await client.query('COMMIT');

      return {
        success: true,
        user: { id: user.id, username: user.username, fullName: user.full_name, role: user.role },
        totpSecret: secret,
        qrCode,
        backupCodes: plainBackupCodes,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
