import { describe, expect, test } from 'vitest';
import type { EmailVerificationRecord, UserRecord, UserRepository } from '../../src/types/domain.js';
import { AuthService } from '../../src/services/auth-service.js';
import { defaultAppConfig } from '../../src/config/env.js';
import { hashPassword } from '../../src/utils/password.js';
import { createEmailVerificationToken, hashEmailVerificationSecret } from '../../src/utils/email-verification-token.js';

describe('email verification tokens', () => {
  test('generates a random raw token and a different deterministic hash', () => {
    const first = createEmailVerificationToken();
    const second = createEmailVerificationToken();

    expect(first.rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(first.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.tokenHash).not.toBe(first.rawToken);
    expect(hashEmailVerificationSecret(first.rawToken)).toBe(first.tokenHash);
    expect(second.rawToken).not.toBe(first.rawToken);
  });
});

const unverifiedUser: UserRecord = {
  id: '66666666-6666-4666-8666-666666666666',
  fullName: 'Verify Student',
  email: 'verify.student@example.test',
  phone: null,
  passwordHash: '',
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

function makeAuthFixture(options: { expired?: boolean } = {}) {
  let storedUser = { ...unverifiedUser };
  let verification: EmailVerificationRecord | null = null;
  const sent: Array<{ to: string; verificationUrl: string }> = [];
  const repository = {
    findByEmail: async (email: string) => email === storedUser.email ? storedUser : null,
    findById: async (id: string) => id === storedUser.id ? storedUser : null,
    create: async (input: Parameters<UserRepository['create']>[0]) => {
      storedUser = {
        ...unverifiedUser,
        ...input,
        id: unverifiedUser.id,
        phone: input.phone ?? null,
        universityId: input.universityId ?? null,
        studentId: input.studentId ?? null,
        profileImageUrl: null,
        isActive: true,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };
      return storedUser;
    },
    touchLastLogin: async () => undefined,
    createEmailVerification: async (input: { userId: string; tokenHash: string; expiresAt: Date }) => {
      verification = {
        id: 'verification-1',
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        usedAt: null,
        createdAt: new Date(),
      };
      return verification;
    },
    consumeEmailVerification: async (tokenHash: string) => {
      if (!verification || verification.tokenHash !== tokenHash || verification.usedAt || options.expired) return null;
      verification = { ...verification, usedAt: new Date() };
      storedUser = { ...storedUser, isVerified: true };
      return storedUser;
    },
  } as UserRepository;
  const mailer = {
    sendEmailVerificationEmail: async (input: { to: string; verificationUrl: string }) => { sent.push(input); },
    sendPasswordResetEmail: async () => undefined,
  };
  const service = new AuthService(repository, defaultAppConfig, mailer);
  return { service, repository, sent, getUser: () => storedUser, getVerification: () => verification };
}

describe('email verification service', () => {
  test('registration sends a verification link without establishing a session', async () => {
    const fixture = makeAuthFixture();

    const result = await fixture.service.register({
      fullName: 'Verify Student',
      email: 'New.Student@example.test',
      password: 'Student@12345',
    });

    expect(result).toMatchObject({ verificationRequired: true });
    expect(result).not.toHaveProperty('token');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(fixture.sent).toHaveLength(1);
    expect(fixture.sent[0].to).toBe('new.student@example.test');
    expect(fixture.sent[0].verificationUrl).toMatch(/^http:\/\/localhost:5173\/verify-email\?token=[a-f0-9]{64}$/);
    expect(fixture.getVerification()?.tokenHash).toBe(hashEmailVerificationSecret(new URL(fixture.sent[0].verificationUrl).searchParams.get('token')!));
  });

  test('rejects password login until the email is verified', async () => {
    const fixture = makeAuthFixture();
    fixture.getUser().passwordHash = await hashPassword('Student@12345');

    await expect(fixture.service.login({ email: fixture.getUser().email, password: 'Student@12345' }))
      .rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED', statusCode: 403 });
  });

  test('consumes a valid verification link and returns a safe verified user', async () => {
    const fixture = makeAuthFixture();
    const registration = await fixture.service.register({ fullName: 'Verify Student', email: 'link.verify@example.test', password: 'Student@12345' });
    const token = new URL(fixture.sent[0].verificationUrl).searchParams.get('token')!;

    const result = await fixture.service.verifyEmail(token);

    expect(result.email).toBe(registration.user.email);
    expect(result).not.toHaveProperty('passwordHash');
    expect(fixture.getUser().isVerified).toBe(true);
    await expect(fixture.service.verifyEmail(token)).rejects.toMatchObject({ code: 'EMAIL_VERIFICATION_INVALID' });
  });

  test('resends only for an active unverified account and does not enumerate users', async () => {
    const fixture = makeAuthFixture();

    await fixture.service.requestEmailVerification('missing@example.test');
    expect(fixture.sent).toHaveLength(0);

    await fixture.service.requestEmailVerification(fixture.getUser().email);
    expect(fixture.sent).toHaveLength(1);
  });

  test('rejects an expired verification token', async () => {
    const fixture = makeAuthFixture({ expired: true });
    await fixture.service.register({ fullName: 'Verify Student', email: 'expired.verify@example.test', password: 'Student@12345' });
    const token = new URL(fixture.sent[0].verificationUrl).searchParams.get('token')!;

    await expect(fixture.service.verifyEmail(token)).rejects.toMatchObject({ code: 'EMAIL_VERIFICATION_INVALID' });
  });
});
