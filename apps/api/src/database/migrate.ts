import fs from 'fs';
import path from 'path';
import { pool } from './db';

async function runMigrations() {
  console.log('[MIGRATE] Running GrievEase database migrations...');
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  const client = await pool.connect();
  try {
    for (const file of files) {
      console.log(`[MIGRATE] Applying migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await client.query(sql);
      console.log(`[MIGRATE] Applied: ${file}`);
    }
    console.log('✅ [MIGRATE] All migrations applied successfully! (Tables, RLS policies, and triggers created)');
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
