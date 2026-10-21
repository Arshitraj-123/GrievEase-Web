import fs from 'fs';
import path from 'path';
import { pool } from './db';

async function runMigrations() {
  console.log('[MIGRATE] Running GrievEase database migrations...');
  const migrationPath = path.join(__dirname, 'migrations', '0001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('✅ [MIGRATE] Migrations applied successfully! (Tables, RLS policies, and triggers created)');
  } catch (err: any) {
    console.error('❌ [MIGRATE] Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

export { runMigrations };
