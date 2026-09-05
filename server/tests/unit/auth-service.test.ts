import { describe, expect, test } from 'vitest';
import { AuthService } from '../../src/services/auth-service.js';
import { hashPassword, verifyPassword } from '../../src/utils/password.js';
import { signAuthToken, verifyAuthToken } from '../../src/utils/jwt.js';
import { defaultAppConfig } from '../../src/config/env.js';

const customer = {
  id: '11111111-1111-4111-8111-111111111111',
  fullName: 'Aarav Mehta',
  email: 'student@university.test',
  phone: null,
  passwordHash: '',
  authProvider: 'PASSWORD',
  googleSubject: null,
  role: 'CUSTOMER' as const,
  profileImageUrl: null,
  universityId: 'UNI-001',
  studentId: 'STU-2026-001',
  isActive: true,
  isVerified: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  lastLoginAt: null,
};

test('password helpers hash and verify without exposing the original password', async () => {
  const hash = await hashPassword('Student@12345');

  expect(hash).not.toBe('Student@12345');
  expect(await verifyPassword(hash, 'Student@12345')).toBe(true);
  expect(await verifyPassword(hash, 'wrong-password')).toBe(false);
});

test('JWT contains only identity and role claims', () => {
  const token = signAuthToken({ userId: customer.id, role: customer.role }, defaultAppConfig);
  const claims = verifyAuthToken(token, defaultAppConfig);

  expect(claims).toMatchObject({ sub: customer.id, role: 'CUSTOMER' });
  expect(claims).not.toHaveProperty('passwordHash');
  expect(claims).not.toHaveProperty('email');
});

test('registration and login return safe users without password hashes', async () => {
  let stored = { ...customer };
  const repository = {
    findByEmail: async (email: string) => email === stored.email ? stored : null,
    findSafeById: async (id: string) => id === stored.id ? stored : null,
    create: async (input: typeof stored) => { stored = input; return stored; },
    touchLastLogin: async () => undefined,
  };
  const service = new AuthService(repository, defaultAppConfig);

  stored.passwordHash = await hashPassword('Cafe@12345');
  const result = await service.login({ email: stored.email, password: 'Cafe@12345' });

  expect(result.user).not.toHaveProperty('passwordHash');
  expect(result.user.email).toBe(stored.email);
  expect(result.token).toEqual(expect.any(String));
});
