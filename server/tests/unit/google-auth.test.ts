import { describe, expect, test } from 'vitest';
import { AuthService } from '../../src/services/auth-service.js';
import type { GoogleProfile } from '../../src/services/google-oauth.js';
import type { UserRecord } from '../../src/types/domain.js';
import { defaultAppConfig } from '../../src/config/env.js';

const existingUser: UserRecord = {
  id: '22222222-2222-4222-8222-222222222222',
  fullName: 'Existing Student',
  email: 'student@example.test',
  phone: null,
  passwordHash: 'not-used',
  authProvider: 'PASSWORD',
  googleSubject: null,
  role: 'CUSTOMER',
  profileImageUrl: null,
  universityId: null,
  studentId: null,
  isActive: true,
  isVerified: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  lastLoginAt: null,
};

function profile(overrides: Partial<GoogleProfile> = {}): GoogleProfile {
  return {
    subject: 'google-subject-1',
    email: 'new.student@example.test',
    fullName: 'New Student',
    profileImageUrl: 'https://example.test/avatar.png',
    emailVerified: true,
    ...overrides,
  };
}

function makeRepository(seed?: UserRecord) {
  let stored = seed ?? null;
  const calls = { created: 0, linked: 0, touched: 0 };
  return {
    calls,
    findByEmail: async (email: string) => stored?.email === email ? stored : null,
    findByGoogleSubject: async (subject: string) => stored?.googleSubject === subject ? stored : null,
    findById: async () => stored,
    createGoogleUser: async (input: { fullName: string; email: string; passwordHash: string; googleSubject: string; profileImageUrl?: string | null }) => {
      calls.created += 1;
      stored = { ...existingUser, ...input, id: '33333333-3333-4333-8333-333333333333', authProvider: 'GOOGLE', googleSubject: input.googleSubject, profileImageUrl: input.profileImageUrl ?? null };
      return stored;
    },
    linkGoogleAccount: async (id: string, subject: string, profileImageUrl?: string | null) => {
      calls.linked += 1;
      if (stored?.id === id) stored = { ...stored, googleSubject: subject, profileImageUrl: profileImageUrl ?? stored.profileImageUrl, isVerified: true };
    },
    create: async () => { throw new Error('not used'); },
    touchLastLogin: async () => { calls.touched += 1; },
  };
}

describe('Google authentication', () => {
  test('creates a customer account for a new verified Google identity', async () => {
    const repository = makeRepository();
    const service = new AuthService(repository, defaultAppConfig);

    const result = await service.loginWithGoogle(profile());

    expect(repository.calls.created).toBe(1);
    expect(result.user.email).toBe('new.student@example.test');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.token).toEqual(expect.any(String));
  });

  test('logs in an existing Google identity without creating a duplicate', async () => {
    const repository = makeRepository({ ...existingUser, authProvider: 'GOOGLE', googleSubject: 'google-subject-1' });
    const service = new AuthService(repository, defaultAppConfig);

    const result = await service.loginWithGoogle(profile());

    expect(repository.calls.created).toBe(0);
    expect(repository.calls.linked).toBe(0);
    expect(repository.calls.touched).toBe(1);
    expect(result.user.id).toBe(existingUser.id);
  });

  test('links a verified Google identity to an existing same-email account', async () => {
    const repository = makeRepository(existingUser);
    const service = new AuthService(repository, defaultAppConfig);

    await service.loginWithGoogle(profile({ email: existingUser.email }));

    expect(repository.calls.created).toBe(0);
    expect(repository.calls.linked).toBe(1);
    expect(repository.calls.touched).toBe(1);
  });

  test('rejects an unverified Google email', async () => {
    const repository = makeRepository();
    const service = new AuthService(repository, defaultAppConfig);

    await expect(service.loginWithGoogle(profile({ emailVerified: false }))).rejects.toMatchObject({ code: 'GOOGLE_EMAIL_UNVERIFIED', statusCode: 401 });
    expect(repository.calls.created).toBe(0);
  });
});
