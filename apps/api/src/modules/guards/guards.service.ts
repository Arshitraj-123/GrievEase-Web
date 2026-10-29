import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { pool } from '../../database/db';
import { StaffPassService } from '../staff/staff-pass.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import {
  GuardProfileDto,
  ShiftItemDto,
  CheckpointDto,
  ScanCheckpointDto,
  CreateIncidentDto,
  IncidentLogItemDto,
  ShiftHandoverDto,
  GateDeviceItemDto,
  RegisterGateDeviceDto,
} from '@grievease/contracts';
import crypto from 'crypto';

@Injectable()
export class GuardsService {
  // In-memory / cache heartbeat registry: guardId -> { timestamp, societyId, deviceId }
  private activeHeartbeats = new Map<string, { timestamp: number; societyId: string; deviceId?: string }>();

  constructor(
    private readonly staffPassService: StaffPassService,
    private readonly notificationsGateway: NotificationsGateway
  ) {}

  // ============================================================================
  // HEARTBEAT & ONLINE STATUS (SAFETY HONESTY)
  // ============================================================================

  /**
   * Record a 15-second heartbeat from an active guard console
   */
  async recordHeartbeat(guardId: string, societyId: string, deviceId?: string): Promise<{ onlineCount: number }> {
    const now = Date.now();
    this.activeHeartbeats.set(guardId, { timestamp: now, societyId, deviceId });

    if (deviceId) {
      // Touch gate_device last_seen_at
      const client = await pool.connect();
      try {
        await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
        await client.query(
          `UPDATE gate_device SET last_seen_at = NOW() WHERE id = $1 AND society_id = $2`,
          [deviceId, societyId]
        );
      } catch {} finally {
        client.release();
      }
    }

    const onlineCount = this.getOnlineGuardsCount(societyId);

    // Emit live heartbeat tick to society
    this.notificationsGateway.server
      ?.to(`society:${societyId}`)
      .emit('guard.heartbeat', {
        onlineCount,
        hasOnlineGuards: onlineCount > 0,
        timestamp: new Date().toISOString(),
      });

    return { onlineCount };
  }

  /**
   * Get the number of guards with active heartbeats within the last 45 seconds
   */
  getOnlineGuardsCount(societyId: string): number {
    const now = Date.now();
    let count = 0;
    for (const [_, data] of this.activeHeartbeats.entries()) {
      if (data.societyId === societyId && now - data.timestamp < 45 * 1000) {
        count++;
      }
    }
    return count;
  }

  // ============================================================================
  // GUARD CONSOLE PIN LOCK
  // ============================================================================

  async setPin(guardId: string, pin: string): Promise<void> {
    const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      await client.query(
        `UPDATE guard_profile SET pin_hash = $1 WHERE user_id = $2`,
        [pinHash, guardId]
      );
    } finally {
      client.release();
    }
  }

  async verifyPin(guardId: string, pin: string): Promise<boolean> {
    const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `SELECT pin_hash FROM guard_profile WHERE user_id = $1`,
        [guardId]
      );
      if (res.rowCount === 0 || !res.rows[0].pin_hash) {
        return false;
      }
      const expected = Buffer.from(res.rows[0].pin_hash, 'hex');
      const given = Buffer.from(pinHash, 'hex');
      return expected.length === given.length && crypto.timingSafeEqual(expected, given);
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // GATE DEVICES
  // ============================================================================

  async registerDevice(
    societyId: string,
    adminId: string,
    dto: RegisterGateDeviceDto
  ): Promise<{ id: string; name: string; deviceToken: string }> {
    const deviceToken = `gdev_${crypto.randomBytes(24).toString('hex')}`;
    const tokenHash = crypto.createHash('sha256').update(deviceToken).digest('hex');

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `INSERT INTO gate_device (
          society_id, gate_id, name, token_hash, registered_by
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name`,
        [societyId, dto.gateId || null, dto.name.trim(), tokenHash, adminId]
      );

      await client.query(
        `INSERT INTO audit_log (
          society_id, actor_id, actor_role, action, entity_type, entity_id, details
        ) VALUES ($1, $2, 'ADMIN', 'GATE_DEVICE_REGISTERED', 'GATE_DEVICE', $3, $4)`,
        [societyId, adminId, res.rows[0].id, JSON.stringify({ name: dto.name })]
      );

      return {
        id: res.rows[0].id,
        name: res.rows[0].name,
        deviceToken,
      };
    } finally {
      client.release();
    }
  }

  async listDevices(societyId: string): Promise<GateDeviceItemDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT d.*, g.name as gate_name
         FROM gate_device d
         LEFT JOIN gate g ON d.gate_id = g.id
         WHERE d.society_id = $1
         ORDER BY d.created_at DESC`,
        [societyId]
      );

      return res.rows.map((r) => ({
        id: r.id,
        gateId: r.gate_id,
        gateName: r.gate_name,
        name: r.name,
        lastSeenAt: r.last_seen_at,
        isRevoked: Boolean(r.revoked_at),
        createdAt: r.created_at,
      }));
    } finally {
      client.release();
    }
  }

  async revokeDevice(societyId: string, adminId: string, deviceId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      await client.query(
        `UPDATE gate_device SET revoked_at = NOW() WHERE id = $1 AND society_id = $2`,
        [deviceId, societyId]
      );

      await client.query(
        `INSERT INTO audit_log (
          society_id, actor_id, actor_role, action, entity_type, entity_id, details
        ) VALUES ($1, $2, 'ADMIN', 'GATE_DEVICE_REVOKED', 'GATE_DEVICE', $3, '{}')`,
        [societyId, adminId, deviceId]
      );
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // GUARD PROFILES
  // ============================================================================

  async getProfile(userId: string): Promise<GuardProfileDto> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT p.*, u.username, u.full_name, u.mobile
         FROM guard_profile p
         JOIN app_user u ON p.user_id = u.id
         WHERE p.user_id = $1`,
        [userId]
      );

      if (res.rowCount === 0) {
        throw new NotFoundException('Guard profile not found');
      }

      const r = res.rows[0];
      return {
        id: r.id,
        userId: r.user_id,
        username: r.username,
        fullName: r.full_name,
        mobile: r.mobile,
        employeeCode: r.employee_code,
        agency: r.agency,
        photoKey: r.photo_key,
        emergencyContactName: r.emergency_contact_name,
        status: r.status,
        hasPin: Boolean(r.pin_hash),
        createdAt: r.created_at,
      };
    } finally {
      client.release();
    }
  }

  async listGuardProfiles(societyId: string): Promise<GuardProfileDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT p.*, u.username, u.full_name, u.mobile
         FROM guard_profile p
         JOIN app_user u ON p.user_id = u.id
         WHERE p.society_id = $1
         ORDER BY p.created_at DESC`,
        [societyId]
      );

      return res.rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        username: r.username,
        fullName: r.full_name,
        mobile: r.mobile,
        employeeCode: r.employee_code,
        agency: r.agency,
        photoKey: r.photo_key,
        emergencyContactName: r.emergency_contact_name,
        status: r.status,
        hasPin: Boolean(r.pin_hash),
        createdAt: r.created_at,
      }));
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // SHIFTS & ATTENDANCE
  // ============================================================================

  async listShifts(societyId: string, guardId?: string): Promise<ShiftItemDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let query = `
        SELECT s.*, u.full_name as guard_name, g.name as gate_name
        FROM shift s
        JOIN app_user u ON s.guard_id = u.id
        LEFT JOIN gate g ON s.gate_id = g.id
        WHERE s.society_id = $1
      `;
      const params: any[] = [societyId];
      if (guardId) {
        query += ` AND s.guard_id = $2`;
        params.push(guardId);
      }
      query += ` ORDER BY s.starts_at DESC LIMIT 50`;

      const res = await client.query(query, params);
      return res.rows.map((r) => ({
        id: r.id,
        guardId: r.guard_id,
        guardName: r.guard_name,
        gateId: r.gate_id,
        gateName: r.gate_name,
        startsAt: r.starts_at,
        endsAt: r.ends_at,
        status: r.status,
      }));
    } finally {
      client.release();
    }
  }

  async checkInShift(societyId: string, guardId: string, shiftId?: string, deviceId?: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      await client.query(
        `INSERT INTO guard_attendance (
          society_id, guard_id, shift_id, check_in_at, device_id, method
        ) VALUES ($1, $2, $3, NOW(), $4, 'DEVICE_LOGIN')`,
        [societyId, guardId, shiftId || null, deviceId || null]
      );

      if (shiftId) {
        await client.query(`UPDATE shift SET status = 'ACTIVE' WHERE id = $1`, [shiftId]);
      }
    } finally {
      client.release();
    }
  }

  async checkOutShift(societyId: string, guardId: string, shiftId?: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      await client.query(
        `UPDATE guard_attendance
         SET check_out_at = NOW()
         WHERE id = (
           SELECT id FROM guard_attendance 
           WHERE society_id = $1 AND guard_id = $2 AND check_out_at IS NULL
           ORDER BY check_in_at DESC LIMIT 1
         )`,
        [societyId, guardId]
      );

      if (shiftId) {
        await client.query(`UPDATE shift SET status = 'COMPLETED' WHERE id = $1`, [shiftId]);
      }
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // INCIDENTS
  // ============================================================================

  async logIncident(societyId: string, guardId: string, dto: CreateIncidentDto): Promise<IncidentLogItemDto> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `INSERT INTO incident_log (
          society_id, guard_id, type, severity, description, photo_keys, gate_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN')
        RETURNING *`,
        [
          societyId,
          guardId,
          dto.type,
          dto.severity,
          dto.description.trim(),
          dto.photoKeys || [],
          dto.gateId || null,
        ]
      );

      const r = res.rows[0];
      const guardRes = await client.query(`SELECT full_name FROM app_user WHERE id = $1`, [guardId]);

      // If critical/high, broadcast to admins immediately
      if (['HIGH', 'CRITICAL'].includes(dto.severity)) {
        this.notificationsGateway.server
          ?.to(`society:${societyId}`)
          .emit('incident.critical', {
            id: r.id,
            type: r.type,
            severity: r.severity,
            description: r.description,
          });
      }

      return {
        id: r.id,
        guardName: guardRes.rows[0]?.full_name || '',
        type: r.type,
        severity: r.severity,
        description: r.description,
        photoKeys: r.photo_keys || [],
        gateName: null,
        status: r.status,
        createdAt: r.created_at,
        reviewedByName: null,
      };
    } finally {
      client.release();
    }
  }

  async listIncidents(societyId: string): Promise<IncidentLogItemDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT i.*, u.full_name as guard_name, rev.full_name as reviewer_name, g.name as gate_name
         FROM incident_log i
         JOIN app_user u ON i.guard_id = u.id
         LEFT JOIN app_user rev ON i.reviewed_by = rev.id
         LEFT JOIN gate g ON i.gate_id = g.id
         WHERE i.society_id = $1
         ORDER BY (CASE WHEN i.status = 'OPEN' THEN 0 ELSE 1 END), i.created_at DESC
         LIMIT 50`,
        [societyId]
      );

      return res.rows.map((r) => ({
        id: r.id,
        guardName: r.guard_name,
        type: r.type,
        severity: r.severity,
        description: r.description,
        photoKeys: r.photo_keys || [],
        gateName: r.gate_name,
        status: r.status,
        createdAt: r.created_at,
        reviewedByName: r.reviewer_name,
      }));
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // CHECKPOINTS & PATROL
  // ============================================================================

  async listCheckpoints(societyId: string): Promise<CheckpointDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT * FROM checkpoint WHERE society_id = $1 ORDER BY sort_order ASC, name ASC`,
        [societyId]
      );

      return res.rows.map((r) => ({
        id: r.id,
        name: r.name,
        qrSlug: r.qr_slug,
        sortOrder: r.sort_order,
      }));
    } finally {
      client.release();
    }
  }

  async scanCheckpoint(societyId: string, guardId: string, dto: ScanCheckpointDto): Promise<{ success: boolean; checkpointName: string }> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const checkRes = await client.query(
        `SELECT id, name FROM checkpoint WHERE society_id = $1 AND qr_slug = $2`,
        [societyId, dto.qrSlug]
      );

      if (checkRes.rowCount === 0) {
        throw new NotFoundException('Checkpoint not recognized');
      }

      const cp = checkRes.rows[0];

      await client.query(
        `INSERT INTO patrol_log (society_id, guard_id, checkpoint_id, scanned_at, shift_id)
         VALUES ($1, $2, $3, NOW(), $4)`,
        [societyId, guardId, cp.id, dto.shiftId || null]
      );

      return { success: true, checkpointName: cp.name };
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // SHIFT HANDOVER
  // ============================================================================

  async submitHandover(societyId: string, guardId: string, dto: ShiftHandoverDto): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      await client.query(
        `INSERT INTO shift_handover (
          society_id, to_shift_id, from_guard_id, to_guard_id, notes
        ) VALUES ($1, $2, $3, $4, $5)`,
        [societyId, dto.toShiftId || null, guardId, dto.toGuardId || null, dto.notes.trim()]
      );
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // STAFF PASS SCAN INTEGRATION (GUARD_SCAN)
  // ============================================================================

  /**
   * Guard scans domestic staff pass QR:
   * 1. Verifies pass via StaffPassService.verify(token)
   * 2. If valid, writes staff_attendance row with source 'GUARD_SCAN' (append-only)
   * 3. Returns photo, name, role, linked flats, schedule status
   */
  async verifyAndLogStaffScan(
    societyId: string,
    guardId: string,
    token: string
  ): Promise<{
    isValid: boolean;
    staffName?: string;
    staffType?: string;
    isScheduleAllowed: boolean;
    allowedFlats: string[];
    reason?: string;
    photoKey?: string | null;
  }> {
    const verification = await this.staffPassService.verify(token);

    if (!verification.isValid || !verification.staffId) {
      return {
        isValid: false,
        isScheduleAllowed: false,
        allowedFlats: [],
        reason: verification.reason || 'Invalid staff pass',
      };
    }

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const staffRes = await client.query(
        `SELECT full_name, staff_type, photo_key FROM domestic_staff WHERE id = $1`,
        [verification.staffId]
      );
      const staff = staffRes.rows[0];

      // Find primary flat link to log attendance
      const linkRes = await client.query(
        `SELECT flat_id FROM staff_flat_link WHERE staff_id = $1 AND entry_allowed = true LIMIT 1`,
        [verification.staffId]
      );

      const flatId = linkRes.rows[0]?.flat_id;
      const todayDate = new Date().toISOString().slice(0, 10);

      if (flatId) {
        // Append-only staff_attendance record with source GUARD_SCAN
        await client.query(
          `INSERT INTO staff_attendance (
            society_id, staff_id, flat_id, date, in_at, source, marked_by, note
          ) VALUES ($1, $2, $3, $4, NOW(), 'GUARD_SCAN', $5, 'Scanned at gate console')`,
          [societyId, verification.staffId, flatId, todayDate, guardId]
        );
      }

      return {
        isValid: true,
        staffName: staff?.full_name || verification.staffName,
        staffType: staff?.staff_type || verification.staffType,
        isScheduleAllowed: verification.isScheduleAllowed,
        allowedFlats: verification.allowedFlats,
        photoKey: staff?.photo_key || null,
        reason: verification.isScheduleAllowed ? undefined : 'Staff entry is outside configured schedule windows',
      };
    } finally {
      client.release();
    }
  }
}
