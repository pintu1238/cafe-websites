import { describe, expect, test } from 'vitest';
import { AuthService } from '../../src/services/auth-service.js';
import type { PasswordResetRecord, UserRecord } from '../../src/types/domain.js';
import { defaultAppConfig } from '../../src/config/env.js';
import { verifyPassword } from '../../src/utils/password.js';

const user: UserRecord = {
  id: '44444444-4444-4444-8444-444444444444',
  fullName: 'Reset Student',
  email: 'reset.student@example.test',
  phone: null,
  passwordHash: 'old-hash',
  authProvider: 'PASSWORD',
  googleSubject: null,
  role: 'CUSTOMER',
  profileImageUrl: null,
  universityId: null,
  studentId: null,
  isActive: true,
  isVerified: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  lastLoginAt: null,
};

function makeFixture(options: { knownUser?: UserRecord | null; expired?: boolean } = {}) {
  let record: PasswordResetRecord | null = null;
  let passwordHash = user.passwordHash;
  const sent: Array<{ to: string; fullName: string; code: string; resetUrl: string; expiresInMinutes: number }> = [];
  const repository = {
    findByEmail: async (email: string) => options.knownUser !== undefined ? (email === options.knownUser?.email ? options.knownUser : null) : (email === user.email ? user : null),
    findByGoogleSubject: async () => null,
    findById: async () => user,
    create: async () => { throw new Error('not used'); },
    createGoogleUser: async () => { throw new Error('not used'); },
    linkGoogleAccount: async () => undefined,
    touchLastLogin: async () => undefined,
    createPasswordReset: async (input: { userId: string; linkTokenHash: string; codeHash: string; expiresAt: Date }) => {
      record = { id: 'reset-1', userId: input.userId, linkTokenHash: input.linkTokenHash, codeHash: input.codeHash, codeResetTokenHash: null, expiresAt: input.expiresAt, codeVerifiedAt: null, usedAt: null, createdAt: new Date() };
      return record;
    },
    findPasswordResetByLinkHash: async (hash: string) => record?.linkTokenHash === hash && !options.expired ? record : null,
    findPasswordResetByCode: async (_email: string, hash: string) => record?.codeHash === hash && !options.expired ? record : null,
    findPasswordResetByTokenHash: async (hash: string) => record && !options.expired && !record.usedAt && (record.linkTokenHash === hash || record.codeResetTokenHash === hash) ? record : null,
    attachCodeResetToken: async (id: string, hash: string) => { if (record?.id === id) record = { ...record, codeResetTokenHash: hash, codeVerifiedAt: new Date() }; },
    markCodeVerified: async () => undefined,
    consumePasswordReset: async (id: string, hash: string) => {
      if (!record || record.id !== id || record.usedAt || options.expired) return false;
      record = { ...record, usedAt: new Date() };
      passwordHash = hash;
      return true;
    },
  };
  const mailer = { sendPasswordResetEmail: async (input: (typeof sent)[number]) => { sent.push(input); } };
  const service = new AuthService(repository, defaultAppConfig, mailer);
  return { service, repository, sent, getPasswordHash: () => passwordHash, getRecord: () => record };
}

describe('password recovery', () => {
  test('returns no enumeration signal and sends no email for an unknown account', async () => {
    const fixture = makeFixture({ knownUser: null });

    await expect(fixture.service.requestPasswordReset('missing@example.test')).resolves.toBeUndefined();
    expect(fixture.sent).toHaveLength(0);
  });

  test('emails a six-digit code and reset link for an active account', async () => {
    const fixture = makeFixture();

    await fixture.service.requestPasswordReset(user.email);

    expect(fixture.sent).toHaveLength(1);
    expect(fixture.sent[0]).toMatchObject({ to: user.email, fullName: user.fullName, expiresInMinutes: 30 });
    expect(fixture.sent[0].code).toMatch(/^\d{6}$/);
    expect(fixture.sent[0].resetUrl).toMatch(/^http:\/\/localhost:5173\/reset-password\?token=[a-f0-9]{64}$/);
    expect(fixture.getRecord()?.linkTokenHash).not.toContain(fixture.sent[0].resetUrl.split('token=')[1]);
  });

  test('verifies the emailed code and returns a reset token', async () => {
    const fixture = makeFixture();
    await fixture.service.requestPasswordReset(user.email);

    const resetToken = await fixture.service.verifyResetCode(user.email, fixture.sent[0].code);

    expect(resetToken).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.getRecord()?.codeResetTokenHash).not.toBe(resetToken);
  });

  test('resets the password once with the emailed link token', async () => {
    const fixture = makeFixture();
    await fixture.service.requestPasswordReset(user.email);
    const linkToken = new URL(fixture.sent[0].resetUrl).searchParams.get('token')!;

    await fixture.service.resetPassword(linkToken, 'NewPassword@123');

    expect(await verifyPassword(fixture.getPasswordHash(), 'NewPassword@123')).toBe(true);
    await expect(fixture.service.resetPassword(linkToken, 'AnotherPassword@123')).rejects.toMatchObject({ code: 'RESET_TOKEN_INVALID' });
  });

  test('rejects expired reset tokens', async () => {
    const fixture = makeFixture({ expired: true });

    await expect(fixture.service.verifyResetCode(user.email, '123456')).rejects.toMatchObject({ code: 'RESET_CODE_INVALID' });
    await expect(fixture.service.resetPassword('a'.repeat(64), 'NewPassword@123')).rejects.toMatchObject({ code: 'RESET_TOKEN_INVALID' });
  });
});
