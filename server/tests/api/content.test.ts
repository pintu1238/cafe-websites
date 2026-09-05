import request from 'supertest';
import type { Pool } from 'pg';
import { describe, expect, test } from 'vitest';
import { createApp } from '../../src/app.js';
import { createApiRouter } from '../../src/routes/index.js';
import { defaultAppConfig } from '../../src/config/env.js';

const pool = {} as Pool;

function createContentApp() {
  return createApp({ apiRouter: createApiRouter({ pool, config: defaultAppConfig }) });
}

describe('informational content routes', () => {
  test('returns FAQ content through the versioned API', async () => {
    const response = await request(createContentApp()).get('/api/v1/content/faqs');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      slug: 'faqs',
      title: 'Frequently asked questions',
    });
    expect(response.body.data.sections.length).toBeGreaterThan(0);
  });

  test('rejects unsupported content slugs with a safe not-found contract', async () => {
    const response = await request(createContentApp()).get('/api/v1/content/not-a-page');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'The requested content page was not found.',
      code: 'CONTENT_NOT_FOUND',
      errors: [],
    });
  });
});
