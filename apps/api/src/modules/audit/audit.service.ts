import { Injectable } from '@nestjs/common';
import { pool } from '../../database/db';
import { computeAuditHash, verifyChain, VerificationResult } from '../../cli/verify-audit';
import { stringify } from 'csv-stringify/sync';

export interface AuditAppendParams {
  societyId: string;
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  ip?: string | null;
  device?: string | null;
}

export interface AuditFilterParams {
  startDate?: string;
  endDate?: string;
  actorId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  async append(params: AuditAppendParams): Promise<{ seq: number; hash: string }> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const latestRes = await client.query(`
        SELECT seq, hash FROM audit_log
        WHERE society_id = $1
        ORDER BY seq DESC LIMIT 1;
      `, [params.societyId]);

      const prevSeq = latestRes.rows.length > 0 ? Number(latestRes.rows[0].seq) : 0;
      const prevHash = latestRes.rows.length > 0 ? latestRes.rows[0].hash : '0'.repeat(64);
      const newSeq = prevSeq + 1;

      const payload = {
        action: params.action,
        actorId: params.actorId || null,
        actorRole: params.actorRole || null,
        after: params.after || null,
        before: params.before || null,
        device: params.device || null,
        entityId: params.entityId || null,
        entityType: params.entityType,
        ip: params.ip || null,
        seq: newSeq,
        societyId: params.societyId,
      };

      const entryHash = computeAuditHash(prevHash, payload);

      await client.query(`
        INSERT INTO audit_log (
          society_id, seq, actor_id, actor_role, action, entity_type, entity_id,
          before, after, ip, device, prev_hash, hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
      `, [
        params.societyId,
        newSeq,
        params.actorId || null,
        params.actorRole || null,
        params.action,
        params.entityType,
        params.entityId || null,
        params.before ? JSON.stringify(params.before) : null,
        params.after ? JSON.stringify(params.after) : null,
        params.ip || null,
        params.device || null,
        prevHash,
        entryHash,
      ]);

      return { seq: newSeq, hash: entryHash };
    } finally {
      client.release();
    }
  }

  async verify(societyId: string): Promise<VerificationResult> {
    return verifyChain(societyId);
  }

  async getLatestHash(societyId: string): Promise<{ seq: number; hash: string; date: string }> {
    const res = await pool.query(`
      SELECT seq, hash, created_at FROM audit_log
      WHERE society_id = $1
      ORDER BY seq DESC LIMIT 1;
    `, [societyId]);

    if (res.rows.length === 0) {
      return { seq: 0, hash: '0'.repeat(64), date: new Date().toISOString() };
    }
    return {
      seq: Number(res.rows[0].seq),
      hash: res.rows[0].hash,
      date: new Date(res.rows[0].created_at).toISOString(),
    };
  }

  async list(societyId: string, filters: AuditFilterParams = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['a.society_id = $1'];
    const values: any[] = [societyId];
    let idx = 2;

    if (filters.startDate) {
      conditions.push(`a.created_at >= $${idx++}`);
      values.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push(`a.created_at <= $${idx++}`);
      values.push(filters.endDate);
    }
    if (filters.actorId) {
      conditions.push(`a.actor_id = $${idx++}`);
      values.push(filters.actorId);
    }
    if (filters.action) {
      conditions.push(`a.action ILIKE $${idx++}`);
      values.push(`%${filters.action}%`);
    }
    if (filters.entityType) {
      conditions.push(`a.entity_type = $${idx++}`);
      values.push(filters.entityType);
    }
    if (filters.entityId) {
      conditions.push(`a.entity_id = $${idx++}`);
      values.push(filters.entityId);
    }

    const whereClause = conditions.join(' AND ');

    const res = await pool.query(`
      SELECT a.*, u.full_name as actor_name, u.username as actor_username
      FROM audit_log a
      LEFT JOIN app_user u ON a.actor_id = u.id
      WHERE ${whereClause}
      ORDER BY a.seq DESC
      LIMIT $${idx++} OFFSET $${idx++};
    `, [...values, limit, offset]);

    const countRes = await pool.query(`
      SELECT COUNT(*) as total FROM audit_log a WHERE ${whereClause};
    `, values);

    return {
      items: res.rows,
      total: Number(countRes.rows[0].total),
      page,
      limit,
    };
  }

  /**
   * Escape formula injection characters for CSV export (=, +, -, @, \t, \r)
   */
  private escapeFormula(val: any): string {
    if (val === null || val === undefined) return '';
    let str = String(val);
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    return str;
  }

  async exportCsv(societyId: string, filters: AuditFilterParams = {}): Promise<string> {
    const verification = await this.verify(societyId);
    const result = await this.list(societyId, { ...filters, page: 1, limit: 10000 });

    const rows = result.items.map((item) => [
      item.seq,
      item.created_at,
      this.escapeFormula(item.actor_name || item.actor_role || 'SYSTEM'),
      this.escapeFormula(item.action),
      this.escapeFormula(item.entity_type),
      this.escapeFormula(item.entity_id || ''),
      this.escapeFormula(item.prev_hash),
      this.escapeFormula(item.hash),
      this.escapeFormula(verification.verified ? 'VERIFIED' : 'TAMPERED'),
    ]);

    const header = [
      'Seq',
      'Timestamp',
      'Actor',
      'Action',
      'EntityType',
      'EntityID',
      'PreviousHash',
      'BlockHash',
      'ChainIntegrity',
    ];

    return stringify([header, ...rows]);
  }
}
