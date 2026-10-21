import { pool } from '../database/db';
import crypto from 'crypto';

export interface VerificationResult {
  societyId: string;
  verified: boolean;
  totalBlocks: number;
  tamperedBlockSeq?: number;
  latestHash: string;
  timestamp: string;
  error?: string;
}

export function computeAuditHash(prevHash: string, data: Record<string, any>): string {
  // Sort keys for deterministic canonical JSON representation
  const sortedKeys = Object.keys(data).sort();
  const canonicalObj: Record<string, any> = {};
  for (const k of sortedKeys) {
    canonicalObj[k] = data[k];
  }
  const canonicalJson = JSON.stringify(canonicalObj);
  return crypto.createHash('sha256').update(prevHash + canonicalJson).digest('hex');
}

export async function verifyChain(societyId: string): Promise<VerificationResult> {
  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

    const res = await client.query(`
      SELECT seq, actor_id, actor_role, action, entity_type, entity_id,
             before, after, ip, device, prev_hash, hash, created_at
      FROM audit_log
      WHERE society_id = $1
      ORDER BY seq ASC;
    `, [societyId]);

    const rows = res.rows;
    if (rows.length === 0) {
      return {
        societyId,
        verified: true,
        totalBlocks: 0,
        latestHash: '0'.repeat(64),
        timestamp: new Date().toISOString(),
      };
    }

    let expectedPrevHash = '0'.repeat(64);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const seq = Number(row.seq);

      if (seq !== i + 1) {
        return {
          societyId,
          verified: false,
          totalBlocks: rows.length,
          tamperedBlockSeq: seq,
          latestHash: row.hash,
          timestamp: new Date().toISOString(),
          error: `Broken sequence gap: expected #${i + 1}, found #${seq}`,
        };
      }

      if (row.prev_hash !== expectedPrevHash) {
        return {
          societyId,
          verified: false,
          totalBlocks: rows.length,
          tamperedBlockSeq: seq,
          latestHash: row.hash,
          timestamp: new Date().toISOString(),
          error: `Broken prev_hash pointer at #${seq}. Expected ${expectedPrevHash}, found ${row.prev_hash}`,
        };
      }

      // Recompute expected hash
      const payload = {
        action: row.action,
        actorId: row.actor_id,
        actorRole: row.actor_role,
        after: row.after,
        before: row.before,
        device: row.device,
        entityId: row.entity_id,
        entityType: row.entity_type,
        ip: row.ip,
        seq: seq,
        societyId,
      };

      const computed = computeAuditHash(row.prev_hash, payload);
      if (computed !== row.hash) {
        return {
          societyId,
          verified: false,
          totalBlocks: rows.length,
          tamperedBlockSeq: seq,
          latestHash: row.hash,
          timestamp: new Date().toISOString(),
          error: `Hash mismatch at block #${seq}. Expected ${computed}, stored ${row.hash}`,
        };
      }

      expectedPrevHash = row.hash;
    }

    const latest = rows[rows.length - 1];
    return {
      societyId,
      verified: true,
      totalBlocks: rows.length,
      latestHash: latest.hash,
      timestamp: new Date().toISOString(),
    };
  } finally {
    client.release();
  }
}

async function runCli() {
  const args: Record<string, string> = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (key && value) args[key] = value;
    }
  });

  const client = await pool.connect();
  let societyId = args['society'] || args['societyId'];

  try {
    let targetSocietyId = societyId;
    if (!targetSocietyId) {
      const socRes = await client.query('SELECT id, name FROM society LIMIT 1;');
      if (socRes.rows.length === 0) {
        console.error('No societies found in database.');
        process.exit(1);
      }
      targetSocietyId = socRes.rows[0].id;
      console.log(`[INFO] Auditing default society: ${socRes.rows[0].name} (${targetSocietyId})`);
    }

    console.log(`[AUDIT] Verifying cryptographic hash chain for society ${targetSocietyId}...`);
    const result = await verifyChain(targetSocietyId!);

    console.log('\n========================================================================================');
    console.log('                    GRIEVEASE AUDIT HASH CHAIN VERIFICATION REPORT                      ');
    console.log('========================================================================================');
    console.log(`Society ID     : ${result.societyId}`);
    console.log(`Status         : ${result.verified ? '✅ CHAIN VALID & UNTAMPERED' : '❌ TAMPER DETECTED'}`);
    console.log(`Total Blocks   : ${result.totalBlocks}`);
    console.log(`Latest Hash    : ${result.latestHash}`);
    console.log(`Timestamp      : ${result.timestamp}`);
    if (result.error) {
      console.log(`Error Details  : ${result.error}`);
    }
    console.log('========================================================================================\n');

    if (!result.verified) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Audit verification error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runCli();
}
