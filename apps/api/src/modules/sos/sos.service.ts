import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { pool } from '../../database/db';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import {
  RaiseSosDto,
  SosAlertItemDto,
  SosResponseItemDto,
  SosSettingDto,
  UpdateSosSettingDto,
  RespondSosDto,
  ResolveSosDto,
  StartDrillDto,
} from '@grievease/contracts';
import crypto from 'crypto';

@Injectable()
export class SosService {
  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  /**
   * Raise a new SOS alert
   */
  async raiseAlert(
    societyId: string,
    userId: string,
    dto: RaiseSosDto,
    raisedByGuard = false
  ): Promise<SosAlertItemDto> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Fetch user and flat details
      const userRes = await client.query(
        `SELECT u.full_name, u.mobile, u.flat_id, f.flat_number
         FROM app_user u
         LEFT JOIN flat f ON u.flat_id = f.id
         WHERE u.id = $1`,
        [userId]
      );

      const user = userRes.rows[0];
      const flatId = dto.flatId || user?.flat_id;
      if (!flatId) {
        throw new BadRequestException('A valid flat reference is required to raise an emergency alert');
      }

      // Read cancel window setting
      const settingRes = await client.query(
        `SELECT cancel_window_seconds, ack_timeout_seconds FROM sos_setting WHERE society_id = $1`,
        [societyId]
      );
      const cancelWindowSecs = settingRes.rows[0]?.cancel_window_seconds ?? 5;
      const cancelWindowEndsAt = new Date(Date.now() + cancelWindowSecs * 1000);

      const alertId = crypto.randomUUID();

      const res = await client.query(
        `INSERT INTO sos_alert (
          id, society_id, flat_id, user_id, raised_by_guard_id, type,
          note, location_mode, lat, lng, accuracy, status,
          raised_at, cancel_window_ends_at, escalation_tier, is_drill
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, 'RAISED',
          NOW(), $12, 1, FALSE
        )
        RETURNING *`,
        [
          alertId,
          societyId,
          flatId,
          userId,
          raisedByGuard ? userId : null,
          dto.type || 'OTHER',
          dto.note?.trim() || null,
          dto.locationMode || 'FLAT_ONLY',
          dto.lat || null,
          dto.lng || null,
          dto.accuracy || null,
          cancelWindowEndsAt,
        ]
      );

      const r = res.rows[0];

      // Audit log
      await client.query(
        `INSERT INTO audit_log (
          society_id, actor_id, actor_role, action, entity_type, entity_id, details
        ) VALUES ($1, $2, $3, 'SOS_ALERT_RAISED', 'SOS_ALERT', $4, $5)`,
        [
          societyId,
          userId,
          raisedByGuard ? 'GUARD' : 'RESIDENT',
          alertId,
          JSON.stringify({ type: dto.type, flatNumber: user?.flat_number }),
        ]
      );

      const alertDto: SosAlertItemDto = {
        id: r.id,
        flatNumber: user?.flat_number || '',
        flatId: r.flat_id,
        residentName: user?.full_name || '',
        residentPhone: user?.mobile || '',
        type: r.type,
        note: r.note,
        locationMode: r.location_mode,
        lat: r.lat,
        lng: r.lng,
        accuracy: r.accuracy,
        status: r.status,
        raisedAt: r.raised_at,
        cancelWindowEndsAt: r.cancel_window_ends_at,
        isDrill: false,
        escalationTier: 1,
        responsesCount: 0,
        remainingCancelSeconds: cancelWindowSecs,
      };

      // Broadcast immediately to Society, Guards, and Admin roles via Socket.io
      this.notificationsGateway.server
        ?.to(`society:${societyId}`)
        .emit('sos.alert_raised', alertDto);

      this.notificationsGateway.server
        ?.to(`role:${societyId}:GUARD`)
        .emit('sos.alert_raised', alertDto);

      this.notificationsGateway.server
        ?.to(`role:${societyId}:SECRETARY`)
        .emit('sos.alert_raised', alertDto);

      this.notificationsGateway.server
        ?.to(`role:${societyId}:COMMITTEE`)
        .emit('sos.alert_raised', alertDto);

      return alertDto;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel alert within the cancellation grace window
   */
  async cancelAlert(societyId: string, userId: string, alertId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `UPDATE sos_alert
         SET status = 'CANCELLED'
         WHERE id = $1 AND society_id = $2 AND user_id = $3 AND status = 'RAISED'
           AND cancel_window_ends_at >= NOW()
         RETURNING id`,
        [alertId, societyId, userId]
      );

      if (res.rowCount === 0) {
        throw new BadRequestException('Cannot cancel: alert has already been fanned out or acknowledged');
      }

      await client.query(
        `INSERT INTO audit_log (
          society_id, actor_id, actor_role, action, entity_type, entity_id, details
        ) VALUES ($1, $2, 'RESIDENT', 'SOS_ALERT_CANCELLED', 'SOS_ALERT', $3, '{}')`,
        [societyId, userId, alertId]
      );

      this.notificationsGateway.server
        ?.to(`society:${societyId}`)
        .emit('sos.cancelled', { alertId });
    } finally {
      client.release();
    }
  }

  /**
   * Atomic first-ACK wins
   */
  async acknowledgeAlert(
    societyId: string,
    userId: string,
    alertId: string
  ): Promise<{ winner: boolean; acknowledgedByName: string; message: string }> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const userRes = await client.query(`SELECT full_name, role FROM app_user WHERE id = $1`, [userId]);
      const userName = userRes.rows[0]?.full_name || 'Responder';
      const userRole = userRes.rows[0]?.role || 'GUARD';

      // Atomic Compare-And-Set: status must be 'RAISED'
      const res = await client.query(
        `UPDATE sos_alert
         SET status = 'ACKNOWLEDGED',
             acknowledged_by = $1,
             acknowledged_at = NOW()
         WHERE id = $2 AND society_id = $3 AND status = 'RAISED'
         RETURNING *`,
        [userId, alertId, societyId]
      );

      if (res.rowCount === 0) {
        // Someone else already acknowledged
        const existing = await client.query(
          `SELECT u.full_name FROM sos_alert a
           JOIN app_user u ON a.acknowledged_by = u.id
           WHERE a.id = $1`,
          [alertId]
        );
        const name = existing.rows[0]?.full_name || 'Another responder';
        return {
          winner: false,
          acknowledgedByName: name,
          message: `Already acknowledged by ${name}`,
        };
      }

      // Add response entry
      await client.query(
        `INSERT INTO sos_response (society_id, alert_id, user_id, role, action, note)
         VALUES ($1, $2, $3, $4, 'ACK', 'Acknowledged emergency alert')`,
        [societyId, alertId, userId, userRole]
      );

      await client.query(
        `INSERT INTO audit_log (
          society_id, actor_id, actor_role, action, entity_type, entity_id, details
        ) VALUES ($1, $2, $3, 'SOS_ALERT_ACKNOWLEDGED', 'SOS_ALERT', $4, $5)`,
        [societyId, userId, userRole, alertId, JSON.stringify({ acknowledgedByName: userName })]
      );

      // Broadcast acknowledgement to society & resident
      this.notificationsGateway.server
        ?.to(`society:${societyId}`)
        .emit('sos.acknowledged', {
          alertId,
          acknowledgedBy: userId,
          acknowledgedByName: userName,
        });

      return {
        winner: true,
        acknowledgedByName: userName,
        message: 'Successfully acknowledged alert',
      };
    } finally {
      client.release();
    }
  }

  /**
   * Responders post progress: ON_THE_WAY, ARRIVED, NOTE
   */
  async respondAlert(
    societyId: string,
    userId: string,
    alertId: string,
    dto: RespondSosDto
  ): Promise<SosResponseItemDto> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const userRes = await client.query(`SELECT full_name, role FROM app_user WHERE id = $1`, [userId]);
      const userName = userRes.rows[0]?.full_name || 'Responder';
      const userRole = userRes.rows[0]?.role || 'GUARD';

      // Update alert status to RESPONDING if not already resolved
      if (['ON_THE_WAY', 'ARRIVED'].includes(dto.action)) {
        await client.query(
          `UPDATE sos_alert SET status = 'RESPONDING' WHERE id = $1 AND status IN ('RAISED', 'ACKNOWLEDGED')`,
          [alertId]
        );
      }

      const res = await client.query(
        `INSERT INTO sos_response (society_id, alert_id, user_id, role, action, note)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [societyId, alertId, userId, userRole, dto.action, dto.note?.trim() || null]
      );

      const r = res.rows[0];
      const responseDto: SosResponseItemDto = {
        id: r.id,
        alertId: r.alert_id,
        userName,
        role: r.role,
        action: r.action,
        note: r.note,
        createdAt: r.created_at,
      };

      this.notificationsGateway.server
        ?.to(`society:${societyId}`)
        .emit('sos.response_added', responseDto);

      return responseDto;
    } finally {
      client.release();
    }
  }

  /**
   * Resolve an alert (RESOLVED or FALSE_ALARM)
   */
  async resolveAlert(
    societyId: string,
    userId: string,
    alertId: string,
    dto: ResolveSosDto
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `UPDATE sos_alert
         SET status = $1, resolved_by = $2, resolved_at = NOW(), outcome_note = $3
         WHERE id = $4 AND society_id = $5 AND status NOT IN ('RESOLVED', 'FALSE_ALARM', 'CANCELLED')
         RETURNING *`,
        [dto.status, userId, dto.outcomeNote?.trim() || null, alertId, societyId]
      );

      if (res.rowCount === 0) {
        throw new NotFoundException('Active alert not found or already closed');
      }

      const alert = res.rows[0];

      // If FALSE_ALARM, check 30-day repeated count for flat
      if (dto.status === 'FALSE_ALARM') {
        const falseRes = await client.query(
          `SELECT count(*) FROM sos_alert
           WHERE society_id = $1 AND flat_id = $2 AND status = 'FALSE_ALARM'
             AND resolved_at >= NOW() - INTERVAL '30 days'`,
          [societyId, alert.flat_id]
        );
        const count = parseInt(falseRes.rows[0]?.count || '0', 10);
        if (count >= 3) {
          // Flag for admin conversation without disabling button
          await client.query(
            `INSERT INTO audit_log (
              society_id, actor_role, action, entity_type, entity_id, details
            ) VALUES ($1, 'SYSTEM', 'SOS_REPEAT_FALSE_ALARM_FLAGGED', 'FLAT', $2, $3)`,
            [societyId, alert.flat_id, JSON.stringify({ falseAlarmCountIn30Days: count })]
          );
        }
      }

      await client.query(
        `INSERT INTO audit_log (
          society_id, actor_id, actor_role, action, entity_type, entity_id, details
        ) VALUES ($1, $2, 'RESPONDER', 'SOS_ALERT_RESOLVED', 'SOS_ALERT', $3, $4)`,
        [societyId, userId, alertId, JSON.stringify({ status: dto.status, outcome: dto.outcomeNote })]
      );

      this.notificationsGateway.server
        ?.to(`society:${societyId}`)
        .emit('sos.resolved', {
          alertId,
          status: dto.status,
          resolvedBy: userId,
          outcomeNote: dto.outcomeNote,
        });
    } finally {
      client.release();
    }
  }

  /**
   * Start a drill
   */
  async startDrill(societyId: string, adminId: string, dto: StartDrillDto): Promise<SosAlertItemDto> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Pick any flat for drill simulation
      const flatRes = await client.query(`SELECT id, flat_number FROM flat WHERE society_id = $1 LIMIT 1`, [societyId]);
      const flatId = flatRes.rows[0]?.id;

      const alertId = crypto.randomUUID();
      const cancelWindowEndsAt = new Date();

      const res = await client.query(
        `INSERT INTO sos_alert (
          id, society_id, flat_id, user_id, type, note,
          location_mode, status, raised_at, cancel_window_ends_at,
          is_drill, escalation_tier
        ) VALUES (
          $1, $2, $3, $4, $5, '[SOCIETY EMERGENCY DRILL]',
          'FLAT_ONLY', 'RAISED', NOW(), $6,
          TRUE, 1
        )
        RETURNING *`,
        [alertId, societyId, flatId, adminId, dto.type, cancelWindowEndsAt]
      );

      const r = res.rows[0];
      const drillDto: SosAlertItemDto = {
        id: r.id,
        flatNumber: flatRes.rows[0]?.flat_number || 'DRILL',
        flatId: r.flat_id,
        residentName: 'DRILL SIMULATOR',
        residentPhone: '',
        type: r.type,
        note: r.note,
        locationMode: 'FLAT_ONLY',
        status: r.status,
        raisedAt: r.raised_at,
        cancelWindowEndsAt: r.cancel_window_ends_at,
        isDrill: true,
        escalationTier: 1,
        responsesCount: 0,
      };

      this.notificationsGateway.server
        ?.to(`society:${societyId}`)
        .emit('sos.alert_raised', drillDto);

      return drillDto;
    } finally {
      client.release();
    }
  }

  /**
   * List active or past SOS alerts
   */
  async listAlerts(
    societyId: string,
    flatId?: string,
    activeOnly = false
  ): Promise<SosAlertItemDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let query = `
        SELECT a.*, f.flat_number, u.full_name as resident_name, u.mobile as resident_phone,
               ack.full_name as ack_name, res.full_name as res_name,
               (SELECT count(*) FROM sos_response r WHERE r.alert_id = a.id) as response_count
        FROM sos_alert a
        JOIN flat f ON a.flat_id = f.id
        JOIN app_user u ON a.user_id = u.id
        LEFT JOIN app_user ack ON a.acknowledged_by = ack.id
        LEFT JOIN app_user res ON a.resolved_by = res.id
        WHERE a.society_id = $1
      `;
      const params: any[] = [societyId];

      if (flatId) {
        query += ` AND a.flat_id = $2`;
        params.push(flatId);
      }

      if (activeOnly) {
        query += ` AND a.status IN ('RAISED', 'ACKNOWLEDGED', 'RESPONDING')`;
      }

      query += ` ORDER BY a.raised_at DESC LIMIT 50`;

      const res = await client.query(query, params);

      return res.rows.map((r) => ({
        id: r.id,
        flatNumber: r.flat_number,
        flatId: r.flat_id,
        residentName: r.resident_name,
        residentPhone: r.resident_phone,
        type: r.type,
        note: r.note,
        locationMode: r.location_mode,
        lat: r.lat,
        lng: r.lng,
        accuracy: r.accuracy,
        status: r.status,
        raisedAt: r.raised_at,
        cancelWindowEndsAt: r.cancel_window_ends_at,
        acknowledgedByName: r.ack_name,
        acknowledgedAt: r.acknowledged_at,
        resolvedByName: r.res_name,
        resolvedAt: r.resolved_at,
        outcomeNote: r.outcome_note,
        isDrill: r.is_drill,
        escalationTier: r.escalation_tier,
        responsesCount: parseInt(r.response_count || '0', 10),
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get responses for an alert
   */
  async getResponses(societyId: string, alertId: string): Promise<SosResponseItemDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT r.*, u.full_name as user_name
         FROM sos_response r
         JOIN app_user u ON r.user_id = u.id
         WHERE r.society_id = $1 AND r.alert_id = $2
         ORDER BY r.created_at ASC`,
        [societyId, alertId]
      );

      return res.rows.map((r) => ({
        id: r.id,
        alertId: r.alert_id,
        userName: r.user_name,
        role: r.role,
        action: r.action,
        note: r.note,
        createdAt: r.created_at,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get / Update SOS settings
   */
  async getSettings(societyId: string): Promise<SosSettingDto> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT * FROM sos_setting WHERE society_id = $1`,
        [societyId]
      );

      if (res.rowCount === 0) {
        return {
          cancelWindowSeconds: 5,
          ackTimeoutSeconds: 60,
          tier2TimeoutSeconds: 120,
          repeatSound: true,
          drillsEnabled: true,
          gateOfflineAlertMinutes: 5,
        };
      }

      const r = res.rows[0];
      return {
        cancelWindowSeconds: r.cancel_window_seconds,
        ackTimeoutSeconds: r.ack_timeout_seconds,
        tier2TimeoutSeconds: r.tier2_timeout_seconds,
        repeatSound: r.repeat_sound,
        drillsEnabled: r.drills_enabled,
        gateOfflineAlertMinutes: r.gate_offline_alert_minutes,
      };
    } finally {
      client.release();
    }
  }

  async updateSettings(societyId: string, adminId: string, dto: UpdateSosSettingDto): Promise<SosSettingDto> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      await client.query(
        `INSERT INTO sos_setting (
          society_id, cancel_window_seconds, ack_timeout_seconds, tier2_timeout_seconds,
          repeat_sound, drills_enabled, gate_offline_alert_minutes, updated_at
        ) VALUES (
          $1, COALESCE($2, 5), COALESCE($3, 60), COALESCE($4, 120),
          COALESCE($5, TRUE), COALESCE($6, TRUE), COALESCE($7, 5), NOW()
        )
        ON CONFLICT (society_id) DO UPDATE SET
          cancel_window_seconds = COALESCE($2, sos_setting.cancel_window_seconds),
          ack_timeout_seconds = COALESCE($3, sos_setting.ack_timeout_seconds),
          tier2_timeout_seconds = COALESCE($4, sos_setting.tier2_timeout_seconds),
          repeat_sound = COALESCE($5, sos_setting.repeat_sound),
          drills_enabled = COALESCE($6, sos_setting.drills_enabled),
          gate_offline_alert_minutes = COALESCE($7, sos_setting.gate_offline_alert_minutes),
          updated_at = NOW()`,
        [
          societyId,
          dto.cancelWindowSeconds,
          dto.ackTimeoutSeconds,
          dto.tier2TimeoutSeconds,
          dto.repeatSound,
          dto.drillsEnabled,
          dto.gateOfflineAlertMinutes,
        ]
      );

      await client.query(
        `INSERT INTO audit_log (
          society_id, actor_id, actor_role, action, entity_type, entity_id, details
        ) VALUES ($1, $2, 'ADMIN', 'SOS_SETTINGS_UPDATED', 'SOCIETY_SETTING', $1, $3)`,
        [societyId, adminId, JSON.stringify(dto)]
      );

      return this.getSettings(societyId);
    } finally {
      client.release();
    }
  }
}
