import { Injectable } from '@nestjs/common';
import { pool } from '../../database/db';
import crypto from 'crypto';
import { StaffPassVerificationDto } from '@grievease/contracts';

export interface PassTokenPayload {
  staffId: string;
  serial: string;
  societyId: string;
  validTo: string;
}

@Injectable()
export class StaffPassService {
  private readonly passSecret: string;

  constructor() {
    this.passSecret = process.env.STAFF_PASS_SECRET || 'grievease_pass_hmac_secret_key_2026_sec';
  }

  /**
   * Generate an HMAC-SHA256 signed staff pass token
   */
  generatePassToken(payload: PassTokenPayload): { token: string; tokenHash: string } {
    const dataStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.passSecret)
      .update(dataStr)
      .digest('hex');

    const token = `${dataStr}.${signature}`;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, tokenHash };
  }

  /**
   * Verify an HMAC-SHA256 signed staff pass token with schedule window enforcement
   */
  async verify(token: string): Promise<StaffPassVerificationDto> {
    const parts = token.split('.');
    const dataStr = parts[0];
    const signature = parts[1];
    if (parts.length !== 2 || !dataStr || !signature) {
      return {
        isValid: false,
        isScheduleAllowed: false,
        reason: 'Malformed pass token format',
        allowedFlats: [],
      };
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.passSecret)
      .update(dataStr)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSignature, 'hex');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return {
        isValid: false,
        isScheduleAllowed: false,
        reason: 'Invalid cryptographic pass signature',
        allowedFlats: [],
      };
    }

    let payload: PassTokenPayload;
    try {
      payload = JSON.parse(Buffer.from(dataStr, 'base64url').toString('utf8'));
    } catch {
      return {
        isValid: false,
        isScheduleAllowed: false,
        reason: 'Invalid token JSON payload',
        allowedFlats: [],
      };
    }

    // 1. Check expiration date on token
    if (new Date(payload.validTo) <= new Date()) {
      return {
        isValid: false,
        staffId: payload.staffId,
        isScheduleAllowed: false,
        reason: 'Staff pass has expired',
        allowedFlats: [],
      };
    }

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // 2. Check pass status in database
      const passRes = await client.query(`
        SELECT sp.status as pass_status, s.full_name, s.staff_type, s.status as staff_status, s.block_reason
        FROM staff_pass sp
        JOIN domestic_staff s ON sp.staff_id = s.id
        WHERE sp.staff_id = $1 AND sp.serial = $2;
      `, [payload.staffId, payload.serial]);

      if (passRes.rows.length === 0) {
        return {
          isValid: false,
          staffId: payload.staffId,
          isScheduleAllowed: false,
          reason: 'Pass record not found in society database',
          allowedFlats: [],
        };
      }

      const row = passRes.rows[0];

      if (row.pass_status !== 'ACTIVE') {
        return {
          isValid: false,
          staffId: payload.staffId,
          staffName: row.full_name,
          staffType: row.staff_type,
          status: row.staff_status,
          isScheduleAllowed: false,
          reason: `Staff pass is ${row.pass_status.toLowerCase()}`,
          allowedFlats: [],
        };
      }

      if (row.staff_status === 'BLOCKED') {
        return {
          isValid: false,
          staffId: payload.staffId,
          staffName: row.full_name,
          staffType: row.staff_type,
          status: 'BLOCKED',
          isScheduleAllowed: false,
          reason: 'Staff member is blocked from entering the society',
          allowedFlats: [],
        };
      }

      if (row.staff_status !== 'VERIFIED') {
        return {
          isValid: false,
          staffId: payload.staffId,
          staffName: row.full_name,
          staffType: row.staff_type,
          status: row.staff_status,
          isScheduleAllowed: false,
          reason: `Staff member status is ${row.staff_status}`,
          allowedFlats: [],
        };
      }

      // 3. Fetch active links and schedule windows
      const linksRes = await client.query(`
        SELECT sfl.flat_id, f.flat_number, w.name as wing_name, sfl.schedule
        FROM staff_flat_link sfl
        JOIN flat f ON sfl.flat_id = f.id
        JOIN wing w ON f.wing_id = w.id
        WHERE sfl.staff_id = $1 AND sfl.entry_allowed = TRUE
          AND (sfl.active_to IS NULL OR sfl.active_to >= CURRENT_DATE);
      `, [payload.staffId]);

      if (linksRes.rows.length === 0) {
        return {
          isValid: false,
          staffId: payload.staffId,
          staffName: row.full_name,
          staffType: row.staff_type,
          status: 'VERIFIED',
          isScheduleAllowed: false,
          reason: 'No active flat associations found for staff member',
          allowedFlats: [],
        };
      }

      const allowedFlats = linksRes.rows.map((r) => `${r.wing_name}-${r.flat_number}`);

      // 4. Enforce Schedule Window check (day of week + current time)
      const now = new Date();
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const currentDay = days[now.getDay()];
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      let isScheduleAllowed = false;
      for (const link of linksRes.rows) {
        const schedule = Array.isArray(link.schedule) ? link.schedule : [];
        for (const window of schedule) {
          if (window.day === currentDay) {
            const [sh, sm] = window.startTime.split(':').map(Number);
            const [eh, em] = window.endTime.split(':').map(Number);
            const startMinutes = sh * 60 + sm;
            const endMinutes = eh * 60 + em;

            if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
              isScheduleAllowed = true;
              break;
            }
          }
        }
        if (isScheduleAllowed) break;
      }

      return {
        isValid: true,
        staffId: payload.staffId,
        staffName: row.full_name,
        staffType: row.staff_type,
        status: 'VERIFIED',
        isScheduleAllowed,
        reason: isScheduleAllowed ? undefined : `Outside scheduled hours for ${currentDay}`,
        allowedFlats,
      };
    } finally {
      client.release();
    }
  }
}
