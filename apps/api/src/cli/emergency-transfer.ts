import { pool } from '../database/db';
import crypto from 'crypto';

function parseArgs() {
  const args: Record<string, string> = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (key && value) args[key] = value;
    }
  });
  return args;
}

async function emergencyTransfer() {
  const args = parseArgs();
  const memberId = args['member-id'] || args['memberId'];
  const witness1 = args['witness1'];
  const witness2 = args['witness2'];

  if (!memberId || !witness1 || !witness2) {
    console.error('❌ [ERROR] Missing required parameters.');
    console.error('Usage: pnpm admin:emergency-transfer --member-id=<MEMBER_ID> --witness1="<NAME>" --witness2="<NAME>"');
    process.exit(1);
  }

  console.log(`[EMERGENCY TRANSFER] Initiating Super Admin transfer to ${memberId} with witnesses: "${witness1}", "${witness2}"...`);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

    // 1. Find the target member
    const targetRes = await client.query(`
      SELECT id, society_id, member_id, username, full_name, role, status
      FROM app_user
      WHERE member_id = $1;
    `, [memberId]);

    if (targetRes.rows.length === 0) {
      console.error(`❌ Member with ID '${memberId}' not found.`);
      await client.query('ROLLBACK');
      process.exit(1);
    }

    const targetUser = targetRes.rows[0];
    if (targetUser.status !== 'ACTIVE') {
      console.error(`❌ Member '${memberId}' is not ACTIVE (current status: ${targetUser.status}). Only active members can be promoted.`);
      await client.query('ROLLBACK');
      process.exit(1);
    }

    // 2. Find existing active Super Admin if any
    const existingAdminRes = await client.query(`
      SELECT id, member_id, username, full_name FROM app_user
      WHERE role = 'SUPER_ADMIN' AND status = 'ACTIVE';
    `);

    let outgoingAdmin = existingAdminRes.rows.length > 0 ? existingAdminRes.rows[0] : null;

    if (outgoingAdmin && outgoingAdmin.id === targetUser.id) {
      console.log(`ℹ️ User '${memberId}' is already the active Super Admin.`);
      await client.query('ROLLBACK');
      process.exit(0);
    }

    // Demote outgoing admin to RESIDENT and revoke all sessions
    if (outgoingAdmin) {
      await client.query(`UPDATE app_user SET role = 'RESIDENT' WHERE id = $1;`, [outgoingAdmin.id]);
      await client.query(`UPDATE device_session SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL;`, [outgoingAdmin.id]);
      await client.query(`DELETE FROM totp_secret WHERE user_id = $1;`, [outgoingAdmin.id]);
      console.log(`[INFO] Outgoing Super Admin (${outgoingAdmin.username}) demoted to RESIDENT, sessions revoked, TOTP removed.`);
    }

    // Promote new Super Admin
    await client.query(`
      UPDATE app_user
      SET role = 'SUPER_ADMIN', must_change_password = true
      WHERE id = $1;
    `, [targetUser.id]);

    // Revoke target user's existing sessions to enforce fresh login and TOTP enrolment
    await client.query(`UPDATE device_session SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL;`, [targetUser.id]);
    await client.query(`DELETE FROM totp_secret WHERE user_id = $1;`, [targetUser.id]);

    // 3. Append to immutable audit log with hash-chaining
    const societyId = targetUser.society_id;
    const latestAuditRes = await client.query(`
      SELECT seq, hash FROM audit_log WHERE society_id = $1 ORDER BY seq DESC LIMIT 1;
    `, [societyId]);

    const prevSeq = latestAuditRes.rows.length > 0 ? Number(latestAuditRes.rows[0].seq) : 0;
    const prevHash = latestAuditRes.rows.length > 0 ? latestAuditRes.rows[0].hash : '0'.repeat(64);
    const newSeq = prevSeq + 1;

    const auditPayload = {
      action: 'SUPER_ADMIN_BREAK_GLASS_TRANSFER',
      societyId,
      newSuperAdminId: targetUser.id,
      newSuperAdminMemberId: targetUser.memberId,
      outgoingSuperAdminId: outgoingAdmin ? outgoingAdmin.id : null,
      witness1,
      witness2,
      timestamp: new Date().toISOString(),
    };

    const canonicalJson = JSON.stringify(auditPayload);
    const entryHash = crypto.createHash('sha256').update(prevHash + canonicalJson).digest('hex');

    await client.query(`
      INSERT INTO audit_log (
        society_id, seq, actor_id, actor_role, action, entity_type, entity_id,
        before, after, ip, device, prev_hash, hash
      ) VALUES ($1, $2, NULL, 'SYSTEM_CLI', 'SUPER_ADMIN_BREAK_GLASS_TRANSFER', 'app_user', $3,
        $4, $5, '127.0.0.1', 'CLI-Shell', $6, $7);
    `, [
      societyId,
      newSeq,
      targetUser.id,
      JSON.stringify(outgoingAdmin ? { role: 'SUPER_ADMIN', user: outgoingAdmin.username } : {}),
      JSON.stringify({ role: 'SUPER_ADMIN', user: targetUser.username, witness1, witness2 }),
      prevHash,
      entryHash,
    ]);

    // 4. In-App Notification alert for governing body & admins
    await client.query(`
      INSERT INTO in_app_notification (society_id, target_role, title, message, type)
      VALUES ($1, 'SECRETARY', '🚨 BREAK-GLASS SUPER ADMIN TRANSFER EXECUTED', $2, 'ALERT'),
             ($1, 'CHAIRMAN', '🚨 BREAK-GLASS SUPER ADMIN TRANSFER EXECUTED', $2, 'ALERT'),
             ($1, 'GOVERNING_BODY', '🚨 BREAK-GLASS SUPER ADMIN TRANSFER EXECUTED', $2, 'ALERT');
    `, [
      societyId,
      `Super Admin role was reassigned to ${targetUser.fullName} (${targetUser.memberId}) via CLI break-glass witnessed by ${witness1} and ${witness2}.`
    ]);

    await client.query('COMMIT');

    console.log('\n========================================================================================');
    console.log('       EMERGENCY BREAK-GLASS SUPER ADMIN TRANSFER COMPLETED SUCCESSFULLY                ');
    console.log('========================================================================================');
    console.log(`New Super Admin: ${targetUser.fullName} (${targetUser.username}, Member: ${targetUser.memberId})`);
    console.log(`Recorded Witnesses: "${witness1}", "${witness2}"`);
    console.log(`Audit Sequence #${newSeq} Sealed with Hash: ${entryHash}`);
    console.log('Next login will enforce TOTP enrolment and password update.');
    console.log('========================================================================================\n');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ [EMERGENCY TRANSFER FAILED]:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  emergencyTransfer();
}

export { emergencyTransfer };
