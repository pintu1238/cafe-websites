import { describe, expect, test } from 'vitest';
import { requireRole } from '../../src/middleware/require-role.js';

test('role middleware rejects a disallowed authenticated user with 403', () => {
  const middleware = requireRole('SHOPKEEPER');
  const request = {
    auth: { userId: 'user-1', role: 'CUSTOMER' as const },
  } as never;
  const response = {
    status: () => response,
    json: (body: unknown) => { response.body = body; return response; },
    body: undefined as unknown,
  };
  let nextCalled = false;

  middleware(request, response as never, () => { nextCalled = true; });

  expect(nextCalled).toBe(false);
  expect(response.body).toEqual({
    success: false,
    message: 'You do not have permission to perform this action.',
    code: 'FORBIDDEN',
    errors: [],
  });
});

test('role middleware allows an authenticated user with the required role', () => {
  const middleware = requireRole('SHOPKEEPER');
  const request = {
    auth: { userId: 'user-1', role: 'SHOPKEEPER' as const },
  } as never;
  let nextCalled = false;

  middleware(request, {} as never, () => { nextCalled = true; });

  expect(nextCalled).toBe(true);
});
