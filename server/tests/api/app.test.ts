import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { Router } from 'express';
import { createApp } from '../../src/app.js';
import { AppError } from '../../src/utils/app-error.js';

describe('Express API foundation', () => {
  test('returns the versioned health contract', async () => {
    const response = await request(createApp()).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { status: 'ok' } });
  });

  test('allows the external image host used by the client', async () => {
    const response = await request(createApp()).get('/api/v1/health');

    expect(response.headers['content-security-policy']).toContain(
      "img-src 'self' data: https://images.unsplash.com",
    );
  });

  test('reports database readiness when the configured database responds', async () => {
    const queries: string[] = [];
    const database = {
      query: async (text: string) => {
        queries.push(text);
        return { rows: [], rowCount: 1 };
      },
    };

    const response = await request(createApp({ database })).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { status: 'ok', database: 'connected' } });
    expect(queries).toEqual(['SELECT 1']);
  });

  test('returns a safe database-unavailable health response', async () => {
    const database = {
      query: async () => { throw new Error('postgresql://postgres:secret@example.test/db'); },
    };

    const response = await request(createApp({ database })).get('/api/v1/health');

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({ success: false, code: 'DATABASE_UNAVAILABLE' });
    expect(JSON.stringify(response.body)).not.toContain('secret');
    expect(JSON.stringify(response.body)).not.toContain('postgresql://');
  });

  test('returns a safe not-found response', async () => {
    const response = await request(createApp()).get('/api/v1/not-real');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    });
    expect(response.body.stack).toBeUndefined();
  });

  test('serializes application errors without leaking stack traces', async () => {
    const testRouter = Router();
    testRouter.get('/test-error', (_request, _response, next) => {
      next(new AppError('NOPE', 'A safe message', 422));
    });
    const app = createApp({ apiRouter: testRouter });

    const response = await request(app).get('/api/v1/test-error');

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      message: 'A safe message',
      code: 'NOPE',
      errors: [],
    });
  });
});
