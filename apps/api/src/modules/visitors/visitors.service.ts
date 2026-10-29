import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { pool } from '../../database/db';
import { VisitorPassService } from './visitor-pass.service';
import { StaffCryptoService } from '../staff/staff-crypto.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import {
  CreateVisitorPassDto,
  VisitorPassItemDto,
  CreateWalkinDto,
  RespondApprovalDto,
  VisitLogItemDto,
  CreateDeliveryExpectedDto,
  DeliveryExpectedItemDto,
  LogDeliveryArrivalDto,
  DeliveryLogItemDto,
  CreateBlocklistDto,
  BlocklistItemDto,
  CreateFrequentVisitorDto,
  FrequentVisitorItemDto,
} from '@grievease/contracts';
import crypto from 'crypto';

@Injectable()
export class VisitorsService {
  constructor(
    private readonly passService: VisitorPassService,
    private readonly cryptoService: StaffCryptoService,
    private readonly notificationsGateway: NotificationsGateway
  ) {}

  /**
   * Create pre-approved visitor pass
   */
  async createPass(
    societyId: string,
    userId: string,
    dto: CreateVisitorPassDto
  ): Promise<VisitorPassItemDto> {
    const { code, codeHash } = await this.passService.generateGateCode(societyId);
    const passId = crypto.randomUUID();
    const serial = `VP-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const { token, tokenHash } = this.passService.generatePassToken({
      passId,
      societyId,
      serial,
      validTo: dto.validTo,
      type: dto.type,
    });

    const encryptedPhone = dto.visitorPhone ? this.cryptoService.encrypt(dto.visitorPhone) : null;

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `INSERT INTO visitor_pass (
          id, society_id, flat_id, host_user_id, type, visitor_name,
          visitor_phone_encrypted, purpose, guests_count, vehicle_no,
          valid_from, valid_to, recurrence, max_entries, entries_used,
          code_hash, pass_code, token_hash, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 0,
          $15, $16, $17, 'ACTIVE'
        )
        RETURNING *`,
        [
          passId,
          societyId,
          dto.flatId,
          userId,
          dto.type,
          dto.visitorName.trim(),
          encryptedPhone,
          dto.purpose.trim(),
          dto.guestsCount || 1,
          dto.vehicleNo?.trim().toUpperCase() || null,
          dto.validFrom,
          dto.validTo,
          dto.recurrence ? JSON.stringify(dto.recurrence) : null,
          dto.maxEntries || 1,
          codeHash,
          code,
          tokenHash,
        ]
      );

      const pass = res.rows[0];

      // Audit log entry
      await client.query(
        `INSERT INTO audit_log (
          society_id, actor_id, actor_role, action, entity_type, entity_id, details
        ) VALUES ($1, $2, 'RESIDENT', 'VISITOR_PASS_CREATED', 'VISITOR_PASS', $3, $4)`,
        [societyId, userId, passId, JSON.stringify({ visitorName: dto.visitorName, type: dto.type })]
      );

      const flatRes = await client.query(`SELECT flat_number FROM flat WHERE id = $1`, [dto.flatId]);
      const userRes = await client.query(`SELECT full_name FROM app_user WHERE id = $1`, [userId]);

      return {
        id: pass.id,
        type: pass.type,
        visitorName: pass.visitor_name,
        visitorPhone: dto.visitorPhone,
        purpose: pass.purpose,
        guestsCount: pass.guests_count,
        vehicleNo: pass.vehicle_no,
        validFrom: pass.valid_from,
        validTo: pass.valid_to,
        passCode: code,
        qrToken: token,
        status: pass.status,
        entriesUsed: pass.entries_used,
        maxEntries: pass.max_entries,
        flatNumber: flatRes.rows[0]?.flat_number || '',
        hostName: userRes.rows[0]?.full_name || '',
        createdAt: pass.created_at,
      };
    } finally {
      client.release();
    }
  }

  /**
   * List visitor passes for resident flat
   */
  async listPasses(societyId: string, flatId?: string): Promise<VisitorPassItemDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let query = `
        SELECT p.*, f.flat_number, u.full_name as host_name
        FROM visitor_pass p
        JOIN flat f ON p.flat_id = f.id
        JOIN app_user u ON p.host_user_id = u.id
        WHERE p.society_id = $1
      `;
      const params: any[] = [societyId];

      if (flatId) {
        query += ` AND p.flat_id = $2`;
        params.push(flatId);
      }

      query += ` ORDER BY p.created_at DESC LIMIT 100`;

      const res = await client.query(query, params);

      return res.rows.map((row) => ({
        id: row.id,
        type: row.type,
        visitorName: row.visitor_name,
        visitorPhone: row.visitor_phone_encrypted
          ? this.cryptoService.decrypt(row.visitor_phone_encrypted)
          : null,
        purpose: row.purpose,
        guestsCount: row.guests_count,
        vehicleNo: row.vehicle_no,
        validFrom: row.valid_from,
        validTo: row.valid_to,
        passCode: row.pass_code || '******',
        qrToken: row.token_hash,
        status: row.status,
        entriesUsed: row.entries_used,
        maxEntries: row.max_entries,
        flatNumber: row.flat_number,
        hostName: row.host_name,
        createdAt: row.created_at,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Cancel an active visitor pass
   */
  async cancelPass(societyId: string, userId: string, passId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `UPDATE visitor_pass 
         SET status = 'CANCELLED' 
         WHERE id = $1 AND society_id = $2 AND status = 'ACTIVE'
         RETURNING id`,
        [passId, societyId]
      );

      if (res.rowCount === 0) {
        throw new NotFoundException('Active pass not found or already cancelled');
      }

      await client.query(
        `INSERT INTO audit_log (
          society_id, actor_id, actor_role, action, entity_type, entity_id, details
        ) VALUES ($1, $2, 'RESIDENT', 'VISITOR_PASS_CANCELLED', 'VISITOR_PASS', $3, '{}')`,
        [societyId, userId, passId]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Check blocklist for person phone or name/vehicle
   */
  async checkBlocklist(
    societyId: string,
    flatId: string,
    phone?: string,
    name?: string,
    vehicleNo?: string
  ): Promise<{ isBlocked: boolean; reason?: string; blockedBy: 'SOCIETY' | 'RESIDENT' }> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const personHash = phone ? this.cryptoService.computePhoneBlindIndex(phone) : null;

      const res = await client.query(
        `SELECT flat_id, reason FROM blocklist
         WHERE society_id = $1 AND active = true
           AND (flat_id = $5 OR flat_id IS NULL)
           AND (
             (person_hash IS NOT NULL AND person_hash = $2)
             OR (name IS NOT NULL AND LOWER(name) = LOWER($3))
             OR (vehicle_no IS NOT NULL AND UPPER(vehicle_no) = UPPER($4))
           )
         LIMIT 1`,
        [societyId, personHash, name || null, vehicleNo || null, flatId]
      );

      if (res.rowCount && res.rowCount > 0) {
        const item = res.rows[0];
        return {
          isBlocked: true,
          reason: item.reason,
          blockedBy: item.flat_id ? 'RESIDENT' : 'SOCIETY',
        };
      }

      return { isBlocked: false, blockedBy: 'SOCIETY' };
    } finally {
      client.release();
    }
  }

  /**
   * Create a walk-in visit request from the guard console
   */
  async createWalkin(
    societyId: string,
    guardId: string,
    dto: CreateWalkinDto
  ): Promise<{ visitLogId: string; approvalRequestId: string; status: string; isBlocked: boolean }> {
    // 1. Blocklist check
    const blockCheck = await this.checkBlocklist(
      societyId,
      dto.flatId,
      dto.visitorPhone,
      dto.visitorName,
      dto.vehicleNo
    );

    if (blockCheck.isBlocked) {
      return {
        visitLogId: '',
        approvalRequestId: '',
        status: 'BLOCKED',
        isBlocked: true,
      };
    }

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const visitLogId = crypto.randomUUID();
      const approvalRequestId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 120 * 1000); // 120s timeout

      const encPhone = dto.visitorPhone ? this.cryptoService.encrypt(dto.visitorPhone) : null;

      // Create Visit Log
      await client.query(
        `INSERT INTO visit_log (
          id, society_id, flat_id, visitor_name, visitor_phone_encrypted,
          purpose, vehicle_no, guests_count, source, decision,
          in_at, guard_in_id, photo_key, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, 'APPROVED',
          NOW(), $10, $11, $12
        )`,
        [
          visitLogId,
          societyId,
          dto.flatId,
          dto.visitorName.trim(),
          encPhone,
          dto.purpose.trim(),
          dto.vehicleNo?.trim().toUpperCase() || null,
          dto.guestsCount || 1,
          dto.source || 'WALKIN',
          guardId,
          dto.photoKey || null,
          dto.notes || null,
        ]
      );

      // Create Approval Request
      await client.query(
        `INSERT INTO approval_request (
          id, society_id, visit_log_id, flat_id, requested_at, expires_at, status
        ) VALUES ($1, $2, $3, $4, NOW(), $5, 'PENDING')`,
        [approvalRequestId, societyId, visitLogId, dto.flatId, expiresAt]
      );

      const flatRes = await client.query(`SELECT flat_number FROM flat WHERE id = $1`, [dto.flatId]);
      const flatNumber = flatRes.rows[0]?.flat_number || '';

      // Notify flat residents via Socket.io
      this.notificationsGateway.server
        ?.to(`flat:${dto.flatId}`)
        .emit('visitor.approval_request', {
          id: approvalRequestId,
          visitLogId,
          flatId: dto.flatId,
          flatNumber,
          visitorName: dto.visitorName,
          purpose: dto.purpose,
          vehicleNo: dto.vehicleNo,
          guestsCount: dto.guestsCount || 1,
          expiresAt: expiresAt.toISOString(),
          remainingSeconds: 120,
        });

      return {
        visitLogId,
        approvalRequestId,
        status: 'PENDING',
        isBlocked: false,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Atomic first-response-wins approval/denial
   */
  async respondApproval(
    societyId: string,
    userId: string,
    dto: RespondApprovalDto
  ): Promise<{ status: string; winner: boolean; message: string }> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const finalStatus = dto.decision === 'WAIT' ? 'PENDING' : dto.decision;

      if (dto.decision === 'WAIT') {
        // Emit wait notice to guard
        this.notificationsGateway.server
          ?.to(`society:${societyId}`)
          .emit('visitor.approval_wait', {
            requestId: dto.requestId,
            userId,
          });
        return { status: 'PENDING', winner: true, message: 'Asked visitor to wait' };
      }

      // Atomic Compare-And-Set
      const res = await client.query(
        `UPDATE approval_request
         SET status = $1, responded_by = $2, responded_at = NOW()
         WHERE id = $3 AND society_id = $4 AND status = 'PENDING'
         RETURNING *`,
        [finalStatus, userId, dto.requestId, societyId]
      );

      if (res.rowCount === 0) {
        // Already responded by another flat member or timed out
        const current = await client.query(
          `SELECT status, responded_by FROM approval_request WHERE id = $1`,
          [dto.requestId]
        );
        return {
          status: current.rows[0]?.status || 'EXPIRED',
          winner: false,
          message: 'Another resident has already responded to this visitor request',
        };
      }

      const req = res.rows[0];

      // Update visit log decision
      await client.query(
        `UPDATE visit_log
         SET decision = $1, decided_at = NOW(), decision_by_user_id = $2
         WHERE id = $3`,
        [finalStatus, userId, req.visit_log_id]
      );

      // Broadcast resolution to flat and guard console
      this.notificationsGateway.server
        ?.to(`flat:${req.flat_id}`)
        .emit('visitor.approval_resolved', {
          id: req.id,
          visitLogId: req.visit_log_id,
          status: finalStatus,
          respondedBy: userId,
        });

      this.notificationsGateway.server
        ?.to(`society:${societyId}`)
        .emit('visitor.approval_resolved', {
          id: req.id,
          visitLogId: req.visit_log_id,
          status: finalStatus,
          respondedBy: userId,
        });

      return {
        status: finalStatus,
        winner: true,
        message: `Visitor successfully ${finalStatus.toLowerCase()}`,
      };
    } finally {
      client.release();
    }
  }

  /**
   * List visits for resident flat or guard/admin overview
   */
  async listVisits(
    societyId: string,
    flatId?: string,
    onlyInside?: boolean
  ): Promise<VisitLogItemDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let query = `
        SELECT v.*, f.flat_number, g.name as gate_name,
               u1.full_name as guard_in_name, u2.full_name as guard_out_name
        FROM visit_log v
        JOIN flat f ON v.flat_id = f.id
        LEFT JOIN gate g ON v.gate_id = g.id
        LEFT JOIN app_user u1 ON v.guard_in_id = u1.id
        LEFT JOIN app_user u2 ON v.guard_out_id = u2.id
        WHERE v.society_id = $1
      `;
      const params: any[] = [societyId];

      if (flatId) {
        query += ` AND v.flat_id = $2`;
        params.push(flatId);
      }

      if (onlyInside) {
        query += ` AND v.out_at IS NULL`;
      }

      query += ` ORDER BY v.in_at DESC LIMIT 100`;

      const res = await client.query(query, params);

      return res.rows.map((row) => ({
        id: row.id,
        visitorName: row.visitor_name,
        purpose: row.purpose,
        vehicleNo: row.vehicle_no,
        guestsCount: row.guests_count,
        flatNumber: row.flat_number,
        flatId: row.flat_id,
        source: row.source,
        decision: row.decision,
        decidedAt: row.decided_at,
        inAt: row.in_at,
        outAt: row.out_at,
        guardInName: row.guard_in_name,
        guardOutName: row.guard_out_name,
        gateName: row.gate_name,
        notes: row.notes,
        overstayAlertedAt: row.overstay_alerted_at,
        photoKey: row.photo_key,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Guard mark visit exit
   */
  async markExit(societyId: string, guardId: string, visitId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      await client.query(
        `UPDATE visit_log
         SET out_at = NOW(), guard_out_id = $1
         WHERE id = $2 AND society_id = $3 AND out_at IS NULL`,
        [guardId, visitId, societyId]
      );
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // DELIVERIES
  // ============================================================================

  async createExpectedDelivery(
    societyId: string,
    userId: string,
    dto: CreateDeliveryExpectedDto
  ): Promise<DeliveryExpectedItemDto> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `INSERT INTO delivery_expected (
          society_id, flat_id, user_id, company, reference,
          window_from, window_to, rule, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'EXPECTED')
        RETURNING *`,
        [
          societyId,
          dto.flatId,
          userId,
          dto.company,
          dto.reference || null,
          dto.windowFrom,
          dto.windowTo,
          dto.rule,
        ]
      );

      const flatRes = await client.query(`SELECT flat_number FROM flat WHERE id = $1`, [dto.flatId]);

      return {
        id: res.rows[0].id,
        flatId: dto.flatId,
        flatNumber: flatRes.rows[0]?.flat_number || '',
        company: res.rows[0].company,
        reference: res.rows[0].reference,
        windowFrom: res.rows[0].window_from,
        windowTo: res.rows[0].window_to,
        rule: res.rows[0].rule,
        status: res.rows[0].status,
        createdAt: res.rows[0].created_at,
      };
    } finally {
      client.release();
    }
  }

  async listExpectedDeliveries(societyId: string, flatId?: string): Promise<DeliveryExpectedItemDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let query = `
        SELECT d.*, f.flat_number
        FROM delivery_expected d
        JOIN flat f ON d.flat_id = f.id
        WHERE d.society_id = $1
      `;
      const params: any[] = [societyId];
      if (flatId) {
        query += ` AND d.flat_id = $2`;
        params.push(flatId);
      }
      query += ` ORDER BY d.created_at DESC LIMIT 50`;

      const res = await client.query(query, params);
      return res.rows.map((r) => ({
        id: r.id,
        flatId: r.flat_id,
        flatNumber: r.flat_number,
        company: r.company,
        reference: r.reference,
        windowFrom: r.window_from,
        windowTo: r.window_to,
        rule: r.rule,
        status: r.status,
        createdAt: r.created_at,
      }));
    } finally {
      client.release();
    }
  }

  async logDeliveryArrival(
    societyId: string,
    guardId: string,
    dto: LogDeliveryArrivalDto
  ): Promise<DeliveryLogItemDto> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `INSERT INTO delivery_log (
          society_id, expected_id, flat_id, company, agent_name,
          arrived_at, resolved_at, outcome, guard_id, note
        ) VALUES (
          $1, $2, $3, $4, $5, NOW(), NOW(), $6, $7, $8
        )
        RETURNING *`,
        [
          societyId,
          dto.expectedId || null,
          dto.flatId,
          dto.company,
          dto.agentName || null,
          dto.outcome,
          guardId,
          dto.note || null,
        ]
      );

      if (dto.expectedId) {
        const expectedStatus = dto.outcome === 'LEFT_AT_GATE' ? 'LEFT_AT_GATE' : 'ARRIVED';
        await client.query(
          `UPDATE delivery_expected SET status = $1 WHERE id = $2`,
          [expectedStatus, dto.expectedId]
        );
      }

      const flatRes = await client.query(`SELECT flat_number FROM flat WHERE id = $1`, [dto.flatId]);
      const guardRes = await client.query(`SELECT full_name FROM app_user WHERE id = $1`, [guardId]);

      // Notify flat
      this.notificationsGateway.server
        ?.to(`flat:${dto.flatId}`)
        .emit('delivery.arrival', {
          id: res.rows[0].id,
          company: dto.company,
          outcome: dto.outcome,
          note: dto.note,
        });

      return {
        id: res.rows[0].id,
        flatId: dto.flatId,
        flatNumber: flatRes.rows[0]?.flat_number || '',
        company: dto.company,
        agentName: dto.agentName,
        arrivedAt: res.rows[0].arrived_at,
        resolvedAt: res.rows[0].resolved_at,
        outcome: res.rows[0].outcome,
        guardName: guardRes.rows[0]?.full_name || '',
        note: dto.note,
        collectedAt: null,
      };
    } finally {
      client.release();
    }
  }

  async listDeliveryLogs(societyId: string, flatId?: string): Promise<DeliveryLogItemDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let query = `
        SELECT l.*, f.flat_number, u.full_name as guard_name
        FROM delivery_log l
        JOIN flat f ON l.flat_id = f.id
        LEFT JOIN app_user u ON l.guard_id = u.id
        WHERE l.society_id = $1
      `;
      const params: any[] = [societyId];
      if (flatId) {
        query += ` AND l.flat_id = $2`;
        params.push(flatId);
      }
      query += ` ORDER BY l.arrived_at DESC LIMIT 50`;

      const res = await client.query(query, params);
      return res.rows.map((r) => ({
        id: r.id,
        flatId: r.flat_id,
        flatNumber: r.flat_number,
        company: r.company,
        agentName: r.agent_name,
        arrivedAt: r.arrived_at,
        resolvedAt: r.resolved_at,
        outcome: r.outcome,
        guardName: r.guard_name,
        note: r.note,
        collectedAt: r.collected_at,
      }));
    } finally {
      client.release();
    }
  }

  async markDeliveryCollected(societyId: string, userId: string, deliveryId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      await client.query(
        `UPDATE delivery_log 
         SET collected_at = NOW(), outcome = 'HANDED_OVER'
         WHERE id = $1 AND society_id = $2`,
        [deliveryId, societyId]
      );

      await client.query(
        `INSERT INTO audit_log (
          society_id, actor_id, actor_role, action, entity_type, entity_id, details
        ) VALUES ($1, $2, 'RESIDENT', 'DELIVERY_MARKED_COLLECTED', 'DELIVERY_LOG', $3, '{}')`,
        [societyId, userId, deliveryId]
      );
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // BLOCKLIST & FREQUENT VISITORS
  // ============================================================================

  async addBlocklist(societyId: string, userId: string, dto: CreateBlocklistDto): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const personHash = dto.personPhone ? this.cryptoService.computePhoneBlindIndex(dto.personPhone) : null;

      await client.query(
        `INSERT INTO blocklist (
          society_id, flat_id, person_hash, name, vehicle_no, reason, created_by, active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
        [
          societyId,
          dto.flatId || null,
          personHash,
          dto.name?.trim() || null,
          dto.vehicleNo?.trim().toUpperCase() || null,
          dto.reason.trim(),
          userId,
        ]
      );

      await client.query(
        `INSERT INTO audit_log (
          society_id, actor_id, actor_role, action, entity_type, entity_id, details
        ) VALUES ($1, $2, 'ADMIN', 'BLOCKLIST_ENTRY_ADDED', 'BLOCKLIST', gen_random_uuid(), $3)`,
        [societyId, userId, JSON.stringify({ name: dto.name, reason: dto.reason })]
      );
    } finally {
      client.release();
    }
  }

  async listBlocklist(societyId: string, flatId?: string): Promise<BlocklistItemDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let query = `
        SELECT b.*, f.flat_number
        FROM blocklist b
        LEFT JOIN flat f ON b.flat_id = f.id
        WHERE b.society_id = $1 AND b.active = TRUE
      `;
      const params: any[] = [societyId];
      if (flatId) {
        query += ` AND (b.flat_id = $2 OR b.flat_id IS NULL)`;
        params.push(flatId);
      }
      query += ` ORDER BY b.created_at DESC`;

      const res = await client.query(query, params);
      return res.rows.map((r) => ({
        id: r.id,
        flatNumber: r.flat_number,
        name: r.name,
        vehicleNo: r.vehicle_no,
        reason: r.reason,
        active: r.active,
        createdAt: r.created_at,
      }));
    } finally {
      client.release();
    }
  }

  async addFrequentVisitor(
    societyId: string,
    userId: string,
    dto: CreateFrequentVisitorDto
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const encPhone = dto.phone ? this.cryptoService.encrypt(dto.phone) : null;

      await client.query(
        `INSERT INTO frequent_visitor (
          society_id, user_id, flat_id, name, phone_encrypted, label
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [societyId, userId, dto.flatId, dto.name.trim(), encPhone, dto.label.trim()]
      );
    } finally {
      client.release();
    }
  }

  async listFrequentVisitors(societyId: string, flatId: string): Promise<FrequentVisitorItemDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT * FROM frequent_visitor 
         WHERE society_id = $1 AND flat_id = $2 
         ORDER BY created_at DESC`,
        [societyId, flatId]
      );

      return res.rows.map((r) => ({
        id: r.id,
        flatId: r.flat_id,
        name: r.name,
        phone: r.phone_encrypted ? this.cryptoService.decrypt(r.phone_encrypted) : null,
        label: r.label,
        createdAt: r.created_at,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Nightly retention anonymizer: anonymises names, phones, photos and vehicles older than retention days
   */
  async runRetentionPurge(societyId: string, retentionDays = 90): Promise<{ anonymisedCount: number }> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const res = await client.query(
        `UPDATE visit_log
         SET visitor_name = 'ANONYMISED VISITOR',
             visitor_phone_encrypted = NULL,
             vehicle_no = NULL,
             photo_key = NULL
         WHERE society_id = $1 AND in_at < $2 AND visitor_name != 'ANONYMISED VISITOR'
         RETURNING id`,
        [societyId, cutoff]
      );

      const count = res.rowCount || 0;
      if (count > 0) {
        await client.query(
          `INSERT INTO audit_log (
            society_id, actor_role, action, entity_type, entity_id, details
          ) VALUES ($1, 'SYSTEM', 'VISITOR_RETENTION_PURGE', 'VISIT_LOG', gen_random_uuid(), $2)`,
          [societyId, JSON.stringify({ anonymisedCount: count, retentionDays })]
        );
      }

      return { anonymisedCount: count };
    } finally {
      client.release();
    }
  }
}
