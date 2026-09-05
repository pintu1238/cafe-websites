import { OAuth2Client } from 'google-auth-library';
import type { AppConfig } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export type GoogleProfile = {
  subject: string;
  email: string;
  fullName: string;
  profileImageUrl: string | null;
  emailVerified: boolean;
};

export type GoogleAuthProvider = {
  getAuthorizationUrl(state: string): string;
  exchangeCode(code: string): Promise<GoogleProfile>;
};

export class GoogleOAuthProvider implements GoogleAuthProvider {
  private readonly client: OAuth2Client;

  constructor(private readonly config: AppConfig) {
    this.client = new OAuth2Client(config.googleClientId, config.googleClientSecret, config.googleRedirectUri);
  }

  getAuthorizationUrl(state: string): string {
    this.assertConfigured();
    return this.client.generateAuthUrl({
      access_type: 'online',
      prompt: 'select_account',
      scope: ['openid', 'email', 'profile'],
      state,
    });
  }

  async exchangeCode(code: string): Promise<GoogleProfile> {
    this.assertConfigured();
    if (!code.trim()) {
      throw new AppError('GOOGLE_AUTH_FAILED', 'Google sign-in could not be completed.', 401);
    }

    try {
      const { tokens } = await this.client.getToken(code);
      if (!tokens.id_token) {
        throw new Error('Google did not return an ID token.');
      }
      const ticket = await this.client.verifyIdToken({ idToken: tokens.id_token, audience: this.config.googleClientId });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email || payload.email_verified !== true) {
        throw new Error('Google profile is missing a verified email.');
      }
      const fallbackName = payload.email.split('@')[0] ?? 'Google customer';
      return {
        subject: payload.sub,
        email: payload.email,
        fullName: payload.name?.trim() || fallbackName,
        profileImageUrl: payload.picture ?? null,
        emailVerified: true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('GOOGLE_AUTH_FAILED', 'Google sign-in could not be completed.', 401);
    }
  }

  private assertConfigured() {
    if (!this.config.googleClientId || !this.config.googleClientSecret) {
      throw new AppError('GOOGLE_NOT_CONFIGURED', 'Google sign-in is not configured yet.', 503);
    }
  }
}
