import type { Pool } from 'pg';
import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { defaultAppConfig } from '../../src/config/env.js';
import { createVercelApp } from '../../src/vercel.js';

describe('Vercel application adapter', () => {
  test('exports the API with database readiness checks enabled', async () => {
    const pool = {
      query: async () => ({ rows: [], rowCount: 1 }),
    } as unknown as Pool;

    const app = createVercelApp({
      config: { ...defaultAppConfig, databaseUrl: 'postgresql://localhost/cafeteria' },
      pool,
    });

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: 'ok', database: 'connected' },
    });
  });
});
