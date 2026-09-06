import { readFile } from 'node:fs/promises';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env' });
dotenv.config({ path: 'server/.env' });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000, ssl: process.env.DATABASE_URL.includes('supabase.co') ? { rejectUnauthorized: false } : undefined });
try {
  await pool.query(await readFile(new URL('../database/migrations/005_public_enquiries.sql', import.meta.url), 'utf8'));
  console.log('Public enquiries migration applied.');
} catch {
  console.error('Migration failed. Verify database access and migration permissions.');
  process.exitCode = 1;
} finally { await pool.end(); }

