import type { Request, Response } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { AppConfig } from '../config/env.js';
import { AUTH_COOKIE } from '../middleware/authenticate.js';
import type { AuthService } from '../services/auth-service.js';
import type { GoogleAuthProvider } from '../services/google-oauth.js';
import { AppError } from '../utils/app-error.js';
import { emailVerificationTokenSchema } from '../validators/auth.js';

export const GOOGLE_STATE_COOKIE = 'google_oauth_state';

const cookieOptions = (config: AppConfig) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: config.nodeEnv === 'production',
  path: '/',
});

function setAuthCookie(response: Response, token: string, config: AppConfig) {
  response.cookie(AUTH_COOKIE, token, {
    ...cookieOptions(config),
    maxAge: 2 * 60 * 60 * 1000,
  });
}

function matchesSecret(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAuthController(service: AuthService, config: AppConfig, googleProvider: GoogleAuthProvider) {
  return {
    register: async (request: Request, response: Response) => {
      const result = await service.register(request.body);
      response.status(201).json({ success: true, data: { user: result.user, verificationRequired: result.verificationRequired } });
    },
    login: async (request: Request, response: Response) => {
      const result = await service.login(request.body);
      setAuthCookie(response, result.token, config);
      response.json({ success: true, data: { user: result.user } });
    },
    googleStart: (request: Request, response: Response) => {
      const state = randomBytes(32).toString('hex');
      response.cookie(GOOGLE_STATE_COOKIE, state, {
        ...cookieOptions(config),
        maxAge: 10 * 60 * 1000,
      });
      response.redirect(googleProvider.getAuthorizationUrl(state));
    },
    googleCallback: async (request: Request, response: Response) => {
      const state = typeof request.query.state === 'string' ? request.query.state : '';
      const cookieState = request.cookies?.[GOOGLE_STATE_COOKIE];
      response.clearCookie(GOOGLE_STATE_COOKIE, cookieOptions(config));
      if (typeof cookieState !== 'string' || !matchesSecret(cookieState, state)) {
        response.redirect(`${config.clientOrigin}/login?error=google_auth_failed`);
        return;
      }
      const code = typeof request.query.code === 'string' ? request.query.code : '';
      try {
        const result = await service.loginWithGoogle(await googleProvider.exchangeCode(code));
        setAuthCookie(response, result.token, config);
        response.redirect(config.clientOrigin);
      } catch {
        response.redirect(`${config.clientOrigin}/login?error=google_auth_failed`);
      }
    },
    logout: async (_request: Request, response: Response) => {
      response.clearCookie(AUTH_COOKIE, cookieOptions(config));
      response.json({ success: true, data: { loggedOut: true } });
    },
    me: async (request: Request, response: Response) => {
      if (!request.auth) {
        response.json({ success: true, data: { user: null } });
        return;
      }
      const user = await service.me(request.auth.userId);
      response.json({ success: true, data: { user } });
    },
    forgotPassword: async (request: Request, response: Response) => {
      await service.requestPasswordReset(request.body.email);
      response.status(202).json({ success: true, data: { accepted: true } });
    },
    verifyResetCode: async (request: Request, response: Response) => {
      const resetToken = await service.verifyResetCode(request.body.email, request.body.code);
      response.json({ success: true, data: { resetToken } });
    },
    resetPassword: async (request: Request, response: Response) => {
      await service.resetPassword(request.body.token, request.body.password);
      response.json({ success: true, data: { reset: true } });
    },
    verifyEmail: async (request: Request, response: Response) => {
      try {
        const parsed = emailVerificationTokenSchema.safeParse(request.query);
        if (!parsed.success) throw new AppError('EMAIL_VERIFICATION_INVALID', 'The email verification link is invalid or expired.', 422);
        await service.verifyEmail(parsed.data.token);
        response.redirect(`${config.clientOrigin}/login?verified=1`);
      } catch {
        response.redirect(`${config.clientOrigin}/login?error=email_verification_failed`);
      }
    },
    resendVerification: async (request: Request, response: Response) => {
      await service.requestEmailVerification(request.body.email);
      response.status(202).json({ success: true, data: { accepted: true } });
    },
  };
}
