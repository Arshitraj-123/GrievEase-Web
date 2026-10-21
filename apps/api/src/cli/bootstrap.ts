import crypto from 'crypto';
import { pool } from '../database/db';

async function bootstrap() {
  console.log('[BOOTSTRAP] Initializing Super Admin Setup Token Generation...');
  const client = await pool.connect();

  try {
    // 1. Check if an active SUPER_ADMIN already exists
    const adminCheck = await client.query(`
      SELECT id, username, full_name FROM app_user
      WHERE role = 'SUPER_ADMIN' AND status = 'ACTIVE' LIMIT 1;
    `);

    if (adminCheck.rows.length > 0) {
      console.error('❌ [BOOTSTRAP ERROR] An active Super Admin already exists in this database:');
      console.error(`   Username: ${adminCheck.rows[0].username} (${adminCheck.rows[0].full_name})`);
      console.error('   Setup is permanently locked. For emergency recovery, use `pnpm admin:emergency-transfer`.');
      process.exit(1);
    }

    // 2. Check if bootstrap is already completed in bootstrap_state
    const stateCheck = await client.query(`SELECT setup_completed_at FROM bootstrap_state WHERE id = 1;`);
    if (stateCheck.rows.length > 0 && stateCheck.rows[0].setup_completed_at) {
      console.error('❌ [BOOTSTRAP ERROR] First-time setup has already been completed.');
      process.exit(1);
    }

    // 3. Generate 256-bit one-time token (64 hex characters)
    const setupToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(setupToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // 4. Store hash and expiration in bootstrap_state
    await client.query(`
      INSERT INTO bootstrap_state (id, setup_token_hash, setup_token_expires_at, setup_completed_at)
      VALUES (1, $1, $2, NULL)
      ON CONFLICT (id) DO UPDATE SET
        setup_token_hash = EXCLUDED.setup_token_hash,
        setup_token_expires_at = EXCLUDED.setup_token_expires_at,
        setup_completed_at = NULL;
    `, [tokenHash, expiresAt]);

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    console.log('\n========================================================================================');
    console.log('                 GRIEVEASE FIRST-TIME SUPER ADMIN SETUP TOKEN                           ');
    console.log('========================================================================================');
    console.log('This one-time token is valid for 24 hours and is printed ONLY ONCE:');
    console.log(`\n  SETUP TOKEN : ${setupToken}\n`);
    console.log(`Direct Setup Link: ${baseUrl}/setup?token=${setupToken}\n`);
    console.log('Open the link above in your browser to complete account creation, enrol offline TOTP,');
    console.log('and permanently seal the /setup endpoint.');
    console.log('========================================================================================\n');
  } catch (err: any) {
    console.error('❌ [BOOTSTRAP ERROR]:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  bootstrap();
}

export { bootstrap };
