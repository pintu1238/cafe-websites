import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import type { AppConfig } from './env.js';

export type Queryable = {
  query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<{ rows: T[]; rowCount: number | null }>;
};

export function createPool(config: AppConfig): Pool {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required to create a database pool.');
  }
  return new Pool({
    connectionString: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: config.databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
  });
}

export async function withTransaction<T>(pool: Pool, work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const value = await work(client);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
