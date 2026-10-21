import { Injectable } from '@nestjs/common';
import { pool } from '../../database/db';
import { computeAuditHash, verifyChain, VerificationResult } from '../../cli/verify-audit';

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

@Injectable()
export class AuditService {
  async append(params: AuditAppendParams): Promise<{ seq: number; hash: string }> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Retrieve latest audit block for this society
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

  async list(societyId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const res = await pool.query(`
      SELECT a.*, u.full_name as actor_name, u.username as actor_username
      FROM audit_log a
      LEFT JOIN app_user u ON a.actor_id = u.id
      WHERE a.society_id = $1
      ORDER BY a.seq DESC
      LIMIT $2 OFFSET $3;
    `, [societyId, limit, offset]);

    const countRes = await pool.query(`
      SELECT COUNT(*) as total FROM audit_log WHERE society_id = $1;
    `, [societyId]);

    return {
      items: res.rows,
      total: Number(countRes.rows[0].total),
      page,
      limit,
    };
  }
}
