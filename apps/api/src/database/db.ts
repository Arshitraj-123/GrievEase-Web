import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || 'grievease_user'}:${process.env.DB_PASSWORD || 'local_dev_secret_replace_in_prod'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'grievease_db'}`;

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, { schema });

/**
 * Execute a unit of work within a PostgreSQL transaction scoped with tenant RLS session variables.
 */
export async function withTenantContext<T>(
  societyId: string | null,
  userId: string | null,
  isSuperAdmin: boolean,
  fn: (txDb: ReturnType<typeof drizzle>) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (isSuperAdmin) {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
    } else {
      await client.query("SELECT set_config('app.is_super_admin', 'false', true)");
    }

    if (societyId) {
      await client.query("SELECT set_config('app.current_society', $1, true)", [societyId]);
    }

    if (userId) {
      await client.query("SELECT set_config('app.current_user', $1, true)", [userId]);
    }

    const txDb = drizzle(client, { schema });
    const result = await fn(txDb);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
