import path from 'node:path';
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

  test('serves the built SPA shell for browser routes', async () => {
    const pool = {
      query: async () => ({ rows: [], rowCount: 1 }),
    } as unknown as Pool;

    const app = createVercelApp({
      config: { ...defaultAppConfig, databaseUrl: 'postgresql://localhost/cafeteria' },
      pool,
      staticDir: path.resolve('tests/fixtures/static'),
    });

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('cafeteria-spa-fixture');

    const assetResponse = await request(app).get('/assets/app.js');

    expect(assetResponse.status).toBe(200);
    expect(assetResponse.text).toContain('cafeteria-asset-fixture');
  });
});
