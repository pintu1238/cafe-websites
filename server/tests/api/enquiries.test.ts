import request from 'supertest';
import { describe, expect, test, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { createEnquiryRouter } from '../../src/routes/enquiry-routes.js';
import { Router } from 'express';

const valid = { requestKey: '28f4a739-3b97-42a6-a3fb-bf8bf2ade032', kind: 'support', fullName: 'Campus Student', email: 'STUDENT@example.test', campus: 'GNA University', topic: 'Order help', message: 'My pickup order needs assistance at the collection counter.', consent: true };
function setup() {
  const create = vi.fn().mockResolvedValue({ reference: 'UE-test-reference', status: 'NEW', createdAt: '2026-09-06T00:00:00Z' });
  const router = Router(); router.use('/enquiries', createEnquiryRouter({ create }));
  return { app: createApp({ apiRouter: router }), create };
}
describe('public enquiries', () => {
  test('persists a validated request before returning its reference', async () => {
    const { app, create } = setup();
    const result = await request(app).post('/api/v1/enquiries').send(valid);
    expect(result.status).toBe(201);
    expect(result.body.data.reference).toBe('UE-test-reference');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ email: 'student@example.test', kind: 'support' }));
    expect(JSON.stringify(result.body)).not.toContain('student@example.test');
  });
  test.each([
    { consent: false }, { message: 'short' }, { email: 'bad' },
    { role: 'SUPER_ADMIN' }, { kind: 'partner', topic: 'Partnership' },
  ])('rejects invalid input before persistence: %j', async (overrides) => {
    const { app, create } = setup();
    const result = await request(app).post('/api/v1/enquiries').send({ ...valid, ...overrides });
    expect(result.status).toBe(422); expect(create).not.toHaveBeenCalled();
  });
  test('accepts partner applications without creating a privileged account', async () => {
    const { app, create } = setup();
    const result = await request(app).post('/api/v1/enquiries').send({ ...valid, kind: 'partner', topic: 'Partnership', businessName: 'Campus Cafe', phone: '+91 99999 99999' });
    expect(result.status).toBe(201); expect(create).toHaveBeenCalledTimes(1);
    expect(result.headers['set-cookie']).toBeUndefined();
  });
  test('never reports success when storage fails', async () => {
    const { app, create } = setup(); create.mockRejectedValueOnce(new Error('storage unavailable'));
    const result = await request(app).post('/api/v1/enquiries').send(valid);
    expect(result.status).toBe(500); expect(result.body.success).toBe(false);
    expect(result.body.data).toBeUndefined();
  });
  test('does not expose an enquiry inbox publicly', async () => {
    const { app } = setup();
    expect((await request(app).get('/api/v1/enquiries')).status).toBe(404);
  });
  test('limits repeated submissions', async () => {
    const { app, create } = setup();
    for (let i = 0; i < 10; i++) expect((await request(app).post('/api/v1/enquiries').send(valid)).status).toBe(201);
    expect((await request(app).post('/api/v1/enquiries').send(valid)).status).toBe(429);
    expect(create).toHaveBeenCalledTimes(10);
  });
});

