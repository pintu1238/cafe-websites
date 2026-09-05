import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { Router } from 'express';
import { createApp } from '../../src/app.js';
import { defaultAppConfig } from '../../src/config/env.js';
import { createAuthRouter } from '../../src/routes/auth-routes.js';
import { AuthService } from '../../src/services/auth-service.js';
import type { EmailVerificationRecord, PasswordResetRecord, UserRecord } from '../../src/types/domain.js';
import { hashPassword } from '../../src/utils/password.js';
import { createResetToken, hashResetSecret } from '../../src/utils/reset-token.js';

const baseUser: UserRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  fullName: 'Aarav Mehta',
  email: 'student@university.test',
  phone: null,
  passwordHash: '',
  authProvider: 'PASSWORD',
  googleSubject: null,
  role: 'CUSTOMER',
  profileImageUrl: null,
  universityId: 'UNI-001',
  studentId: 'STU-2026-001',
  isActive: true,
  isVerified: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  lastLoginAt: null,
};

function makeAuthApp() {
  const users = new Map<string, UserRecord>();
  let verification: EmailVerificationRecord | null = null;
  let verificationUrl = '';
  const repository = {
    findByEmail: async (email: string) => [...users.values()].find((user) => user.email === email) ?? null,
    findById: async (id: string) => users.get(id) ?? null,
    create: async (input: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt' | 'isActive' | 'isVerified' | 'profileImageUrl'>) => {
      const user: UserRecord = {
        ...input,
        id: baseUser.id,
        phone: input.phone ?? null,
        universityId: input.universityId ?? null,
        studentId: input.studentId ?? null,
        authProvider: input.authProvider ?? 'PASSWORD',
        googleSubject: input.googleSubject ?? null,
        profileImageUrl: null,
        isActive: true,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };
      users.set(user.id, user);
      return user;
    },
    touchLastLogin: async (id: string) => {
      const user = users.get(id);
      if (user) user.lastLoginAt = new Date();
    },
    createEmailVerification: async (input: { userId: string; tokenHash: string; expiresAt: Date }) => {
      verification = { id: 'verification-api', userId: input.userId, tokenHash: input.tokenHash, expiresAt: input.expiresAt, usedAt: null, createdAt: new Date() };
      return verification;
    },
    consumeEmailVerification: async (tokenHash: string) => {
      const user = [...users.values()][0];
      if (!user || !verification || verification.tokenHash !== tokenHash || verification.usedAt || verification.expiresAt <= new Date()) return null;
      verification = { ...verification, usedAt: new Date() };
      const verifiedUser = { ...user, isVerified: true };
      users.set(verifiedUser.id, verifiedUser);
      return verifiedUser;
    },
  };
  const service = new AuthService(repository, defaultAppConfig, {
    sendEmailVerificationEmail: async (input: { verificationUrl: string }) => { verificationUrl = input.verificationUrl; },
    sendPasswordResetEmail: async () => undefined,
  });
  const apiRouter = Router();
  apiRouter.use('/auth', createAuthRouter({ service, users: repository, config: defaultAppConfig }));
  return { app: createApp({ apiRouter }), getVerificationUrl: () => verificationUrl };
}

describe('authentication routes', () => {
  test('registers without a session and requires email verification', async () => {
    const fixture = makeAuthApp();
    const agent = request.agent(fixture.app);
    const register = await agent.post('/api/v1/auth/register').send({
      fullName: 'Aarav Mehta',
      email: 'student@university.test',
      password: 'Student@12345',
    });

    expect(register.status).toBe(201);
    expect(register.body.data.verificationRequired).toBe(true);
    expect(register.body.data.user).not.toHaveProperty('passwordHash');
    expect(register.headers['set-cookie']).toBeUndefined();

    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(401);

    const logout = await agent.post('/api/v1/auth/logout');
    expect(logout.status).toBe(200);
    expect(logout.headers['set-cookie'][0]).toMatch(/Expires=Thu, 01 Jan 1970/i);
  });

  test('verifies an email link before allowing password login', async () => {
    const fixture = makeAuthApp();
    await request(fixture.app).post('/api/v1/auth/register').send({
      fullName: 'Aarav Mehta',
      email: 'student@university.test',
      password: 'Student@12345',
    });

    const verification = await request(fixture.app).get(new URL(fixture.getVerificationUrl()).pathname + new URL(fixture.getVerificationUrl()).search);
    expect(verification.status).toBe(302);
    expect(verification.headers.location).toBe(`${defaultAppConfig.clientOrigin}/login?verified=1`);

    const login = await request(fixture.app).post('/api/v1/auth/login').send({ email: 'student@university.test', password: 'Student@12345' });
    expect(login.status).toBe(200);
    expect(login.headers['set-cookie'][0]).toMatch(/cafeteria_token=/);
  });

  test('redirects malformed or expired verification links to a safe error page', async () => {
    const fixture = makeAuthApp();

    const response = await request(fixture.app).get('/api/v1/auth/verify-email').query({ token: 'not-a-token' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(`${defaultAppConfig.clientOrigin}/login?error=email_verification_failed`);
  });

  test('returns a generic response when resending verification email', async () => {
    const fixture = makeAuthApp();

    const response = await request(fixture.app).post('/api/v1/auth/resend-verification').send({ email: 'missing@example.test' });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ success: true, data: { accepted: true } });
  });

  test('rejects invalid registration input with field errors', async () => {
    const response = await request(makeAuthApp().app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'A', email: 'not-an-email', password: 'short' });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  test('logs in a seeded-style account', async () => {
    const users = new Map([[baseUser.id, { ...baseUser, passwordHash: await hashPassword('Student@12345') }]]);
    const repository = {
      findByEmail: async (email: string) => [...users.values()].find((user) => user.email === email) ?? null,
      findById: async (id: string) => users.get(id) ?? null,
      create: async () => { throw new Error('not used'); },
      touchLastLogin: async () => undefined,
    };
    const service = new AuthService(repository, defaultAppConfig);
    const apiRouter = Router();
    apiRouter.use('/auth', createAuthRouter({ service, users: repository, config: defaultAppConfig }));
    const app = createApp({ apiRouter });

    const response = await request(app).post('/api/v1/auth/login').send({
      email: baseUser.email,
      password: 'Student@12345',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user.role).toBe('CUSTOMER');
    expect(response.headers['set-cookie'][0]).toMatch(/cafeteria_token=/);
  });

  test('starts Google authentication and completes the callback with the normal session cookie', async () => {
    const users = new Map<string, UserRecord>();
    const repository = {
      findByEmail: async (email: string) => [...users.values()].find((item) => item.email === email) ?? null,
      findByGoogleSubject: async (subject: string) => [...users.values()].find((item) => item.googleSubject === subject) ?? null,
      findById: async (id: string) => users.get(id) ?? null,
      create: async () => { throw new Error('not used'); },
      createGoogleUser: async (input: { fullName: string; email: string; passwordHash: string; googleSubject: string; profileImageUrl?: string | null }) => {
        const created = { ...baseUser, ...input, id: '55555555-5555-4555-8555-555555555555', authProvider: 'GOOGLE' as const, googleSubject: input.googleSubject, profileImageUrl: input.profileImageUrl ?? null };
        users.set(created.id, created);
        return created;
      },
      linkGoogleAccount: async () => undefined,
      touchLastLogin: async () => undefined,
    };
    const config = { ...defaultAppConfig, googleClientId: 'client-id', googleClientSecret: 'client-secret' };
    const service = new AuthService(repository, config);
    const apiRouter = Router();
    apiRouter.use('/auth', createAuthRouter({
      service,
      users: repository,
      config,
      googleProvider: {
        getAuthorizationUrl: (state: string) => `https://accounts.google.com/auth?state=${encodeURIComponent(state)}`,
        exchangeCode: async () => ({ subject: 'google-1', email: 'google@example.test', fullName: 'Google Student', profileImageUrl: null, emailVerified: true }),
      },
    }));

    const agent = request.agent(createApp({ apiRouter, config }));
    const start = await agent.get('/api/v1/auth/google');
    const state = new URL(start.headers.location).searchParams.get('state');
    expect(start.status).toBe(302);
    expect(state).toMatch(/^[a-f0-9]{64}$/);
    expect(start.headers['set-cookie'][0]).toMatch(/google_oauth_state=/);

    const callback = await agent.get('/api/v1/auth/google/callback').query({ code: 'auth-code', state });
    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe(defaultAppConfig.clientOrigin);
    expect(callback.headers['set-cookie'].join(';')).toMatch(/cafeteria_token=/);
  });

  test('returns a generic forgot-password response and accepts a valid reset token', async () => {
    let reset: PasswordResetRecord | null = null;
    let changedPasswordHash = '';
    const sent: Array<{ code: string; resetUrl: string }> = [];
    const repository = {
      findByEmail: async (email: string) => email === baseUser.email ? baseUser : null,
      findByGoogleSubject: async () => null,
      findById: async () => baseUser,
      create: async () => { throw new Error('not used'); },
      createGoogleUser: async () => { throw new Error('not used'); },
      linkGoogleAccount: async () => undefined,
      touchLastLogin: async () => undefined,
      createPasswordReset: async (input: { userId: string; linkTokenHash: string; codeHash: string; expiresAt: Date }) => {
        reset = { id: 'reset-api', userId: input.userId, linkTokenHash: input.linkTokenHash, codeHash: input.codeHash, codeResetTokenHash: null, expiresAt: input.expiresAt, codeVerifiedAt: null, usedAt: null, createdAt: new Date() };
        return reset;
      },
      findPasswordResetByLinkHash: async (hash: string) => reset?.linkTokenHash === hash ? reset : null,
      findPasswordResetByCode: async (_email: string, hash: string) => reset?.codeHash === hash ? reset : null,
      findPasswordResetByTokenHash: async (hash: string) => reset && !reset.usedAt && (reset.linkTokenHash === hash || reset.codeResetTokenHash === hash) ? reset : null,
      attachCodeResetToken: async (id: string, hash: string) => { if (reset?.id === id) reset = { ...reset, codeResetTokenHash: hash, codeVerifiedAt: new Date() }; },
      markCodeVerified: async () => undefined,
      consumePasswordReset: async (id: string, hash: string) => { if (!reset || reset.id !== id || reset.usedAt) return false; reset = { ...reset, usedAt: new Date() }; changedPasswordHash = hash; return true; },
    };
    const service = new AuthService(repository, defaultAppConfig, { sendPasswordResetEmail: async (input: { code: string; resetUrl: string }) => { sent.push(input); } });
    const apiRouter = Router();
    apiRouter.use('/auth', createAuthRouter({ service, users: repository, config: defaultAppConfig, mailer: { sendPasswordResetEmail: async (input: { code: string; resetUrl: string }) => { sent.push(input); } } }));
    const app = createApp({ apiRouter });

    const missing = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'missing@example.test' });
    expect(missing.status).toBe(202);
    expect(missing.body.data.accepted).toBe(true);
    expect(sent).toHaveLength(0);

    const forgot = await request(app).post('/api/v1/auth/forgot-password').send({ email: baseUser.email });
    expect(forgot.status).toBe(202);
    expect(sent).toHaveLength(1);
    const linkToken = new URL(sent[0].resetUrl).searchParams.get('token')!;
    expect(reset?.linkTokenHash).toBe(hashResetSecret(linkToken));

    const resetResponse = await request(app).post('/api/v1/auth/reset-password').send({ token: linkToken, password: 'NewPassword@123' });
    expect(resetResponse.status).toBe(200);
    expect(resetResponse.body.data.reset).toBe(true);
    expect(changedPasswordHash).not.toBe('');
  });

  test('rejects an invalid Google OAuth state', async () => {
    const repository = {
      findByEmail: async () => null,
      findByGoogleSubject: async () => null,
      findById: async () => null,
      create: async () => { throw new Error('not used'); },
      createGoogleUser: async () => { throw new Error('not used'); },
      linkGoogleAccount: async () => undefined,
      touchLastLogin: async () => undefined,
    };
    const apiRouter = Router();
    apiRouter.use('/auth', createAuthRouter({
      service: new AuthService(repository, defaultAppConfig),
      users: repository,
      config: defaultAppConfig,
      googleProvider: { getAuthorizationUrl: () => 'https://accounts.google.com/auth', exchangeCode: async () => { throw new Error('not used'); } },
    }));
    const response = await request(createApp({ apiRouter })).get('/api/v1/auth/google/callback').query({ code: 'auth-code', state: 'wrong' });
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(`${defaultAppConfig.clientOrigin}/login?error=google_auth_failed`);
  });
});
