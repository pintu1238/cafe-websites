import request from 'supertest';
import { Router } from 'express';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { createImageRouter } from '../../src/routes/image-routes.js';

function createImageApp() {
  const apiRouter = Router();
  apiRouter.use('/images', createImageRouter());
  return createApp({ apiRouter });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('image proxy route', () => {
  test('rejects image sources outside the approved public image host', async () => {
    const response = await request(createImageApp())
      .get('/api/v1/images')
      .query({ url: 'https://example.com/image.jpg' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      code: 'INVALID_IMAGE_SOURCE',
    });
  });

  test('serves an approved image from the same-origin API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { 'content-type': 'image/jpeg' },
    })));

    const response = await request(createImageApp())
      .get('/api/v1/images')
      .query({ url: 'https://images.unsplash.com/photo-123?auto=format&w=900' });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('image/jpeg');
    expect(response.headers['cache-control']).toContain('immutable');
    expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(Buffer.from(response.body).equals(Buffer.from([1, 2, 3]))).toBe(true);
  });
});
