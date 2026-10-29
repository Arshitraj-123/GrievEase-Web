import { Injectable } from '@nestjs/common';
import { pool } from '../../database/db';
import crypto from 'crypto';
import { VerifyPassResultDto, VisitorPassType } from '@grievease/contracts';

export interface VisitorPassTokenPayload {
  passId: string;
  societyId: string;
  serial: string;
  validTo: string;
  type: VisitorPassType;
}

@Injectable()
export class VisitorPassService {
  private readonly passSecret: string;
  private readonly keyVersion: string;

  constructor() {
    this.passSecret = process.env.VISITOR_PASS_SECRET || 'grievease_visitor_pass_hmac_secret_2026_key!';
    this.keyVersion = process.env.VISITOR_KEY_VERSION || 'v1';
  }

  /**
   * Generate a unique 6-digit gate code for an active pass in the society
   */
  async generateGateCode(societyId: string): Promise<{ code: string; codeHash: string }> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      for (let attempt = 0; attempt < 10; attempt++) {
        // Unambiguous 6-digit numeric code
        const code = Math.floor(100000 + crypto.randomInt(900000)).toString();
        const codeHash = crypto.createHash('sha256').update(code).digest('hex');

        const existing = await client.query(
          `SELECT id FROM visitor_pass WHERE society_id = $1 AND code_hash = $2 AND status = 'ACTIVE'`,
          [societyId, codeHash]
        );

        if (existing.rowCount === 0) {
          return { code, codeHash };
        }
      }

      // Fallback fallback alphanumeric 6 chars if numeric space crowded
      const code = crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      return { code, codeHash };
    } finally {
      client.release();
    }
  }

  /**
   * Generate an HMAC-SHA256 signed QR token for the visitor pass
   */
  generatePassToken(payload: VisitorPassTokenPayload): { token: string; tokenHash: string } {
    const dataStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.passSecret)
      .update(dataStr)
      .digest('hex');

    const token = `${this.keyVersion}.${dataStr}.${signature}`;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, tokenHash };
  }

  /**
   * Constant-time verification of a pass token with full business checks
   */
  async verifyToken(token: string, gateSocietyId?: string): Promise<VerifyPassResultDto> {
    if (!token || typeof token !== 'string') {
      return { isValid: false, reason: 'Missing pass token' };
    }

    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1] || !parts[2]) {
      return { isValid: false, reason: 'Malformed pass token format' };
    }

    const [, dataStr, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', this.passSecret)
      .update(dataStr)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSignature, 'hex');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { isValid: false, reason: 'Invalid cryptographic pass signature' };
    }

    let payload: VisitorPassTokenPayload;
    try {
      payload = JSON.parse(Buffer.from(dataStr, 'base64url').toString('utf8'));
    } catch {
      return { isValid: false, reason: 'Invalid token payload' };
    }

    // Check wrong society
    if (gateSocietyId && payload.societyId !== gateSocietyId) {
      return { isValid: false, reason: 'Pass belongs to another society' };
    }

    // Check expiration timestamp in token
    if (new Date(payload.validTo) <= new Date()) {
      return {
        isValid: false,
        passId: payload.passId,
        isExpired: true,
        reason: 'Pass has expired',
      };
    }

    return this.verifyPassId(payload.passId, gateSocietyId);
  }

  /**
   * Verify pass by 6-digit gate code
   */
  async verifyCode(code: string, societyId: string): Promise<VerifyPassResultDto> {
    const codeHash = crypto.createHash('sha256').update(code.trim()).digest('hex');
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT id FROM visitor_pass 
         WHERE society_id = $1 AND code_hash = $2 AND status = 'ACTIVE'
         ORDER BY created_at DESC LIMIT 1`,
        [societyId, codeHash]
      );

      if (res.rowCount === 0) {
        return { isValid: false, reason: 'Invalid or inactive pass code' };
      }

      return this.verifyPassId(res.rows[0].id, societyId);
    } finally {
      client.release();
    }
  }

  /**
   * Internal pass verification with status, schedule window, and max entries check
   */
  async verifyPassId(passId: string, societyId?: string): Promise<VerifyPassResultDto> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT p.*, f.flat_number, u.full_name as host_name
         FROM visitor_pass p
         JOIN flat f ON p.flat_id = f.id
         JOIN app_user u ON p.host_user_id = u.id
         WHERE p.id = $1`,
        [passId]
      );

      if (res.rowCount === 0) {
        return { isValid: false, reason: 'Pass record not found' };
      }

      const pass = res.rows[0];

      if (societyId && pass.society_id !== societyId) {
        return { isValid: false, reason: 'Pass belongs to another society' };
      }

      if (pass.status === 'CANCELLED') {
        return { isValid: false, passId, status: 'CANCELLED', reason: 'Pass was cancelled by resident' };
      }

      if (pass.status === 'USED') {
        return { isValid: false, passId, status: 'USED', reason: 'Pass has already been used' };
      }

      if (pass.status === 'EXPIRED') {
        return { isValid: false, passId, status: 'EXPIRED', isExpired: true, reason: 'Pass has expired' };
      }

      const now = new Date();
      if (new Date(pass.valid_to) <= now) {
        // Auto-mark expired
        await client.query(`UPDATE visitor_pass SET status = 'EXPIRED' WHERE id = $1`, [passId]);
        return { isValid: false, passId, status: 'EXPIRED', isExpired: true, reason: 'Pass validity period has ended' };
      }

      if (new Date(pass.valid_from) > now) {
        return { isValid: false, passId, reason: 'Pass validity period has not started yet' };
      }

      if (pass.entries_used >= pass.max_entries) {
        await client.query(`UPDATE visitor_pass SET status = 'USED' WHERE id = $1`, [passId]);
        return { isValid: false, passId, status: 'USED', reason: 'Maximum entries exceeded' };
      }

      // Check recurring schedule if present
      let isScheduleAllowed = true;
      if (pass.type === 'RECURRING' && pass.recurrence) {
        const rec = pass.recurrence;
        const currentDay = now.getUTCDay(); // 0-6
        if (Array.isArray(rec.days) && !rec.days.includes(currentDay)) {
          isScheduleAllowed = false;
        }

        if (rec.startTime && rec.endTime) {
          const [startH, startM] = rec.startTime.split(':').map(Number);
          const [endH, endM] = rec.endTime.split(':').map(Number);
          const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;

          if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
            isScheduleAllowed = false;
          }
        }
      }

      return {
        isValid: true,
        passId: pass.id,
        visitorName: pass.visitor_name,
        flatNumber: pass.flat_number,
        flatId: pass.flat_id,
        purpose: pass.purpose,
        guestsCount: pass.guests_count,
        vehicleNo: pass.vehicle_no,
        status: pass.status,
        type: pass.type,
        isExpired: false,
        isScheduleAllowed,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Consume one entry upon guard admission
   */
  async recordEntry(passId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      await client.query(
        `UPDATE visitor_pass 
         SET entries_used = entries_used + 1,
             status = CASE 
               WHEN entries_used + 1 >= max_entries THEN 'USED'
               ELSE status 
             END
         WHERE id = $1`,
        [passId]
      );
    } finally {
      client.release();
    }
  }
}
