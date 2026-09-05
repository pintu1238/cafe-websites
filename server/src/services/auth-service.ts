import type { AppConfig } from '../config/env.js';
import type { CreateUserInput, SafeUser, UserRecord, UserRepository } from '../types/domain.js';
import { AppError } from '../utils/app-error.js';
import { signAuthToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { randomBytes } from 'node:crypto';
import type { GoogleProfile } from './google-oauth.js';
import type { Mailer } from './mailer.js';
import { createResetCode, createResetToken, hashResetSecret } from '../utils/reset-token.js';
import { createEmailVerificationToken, hashEmailVerificationSecret } from '../utils/email-verification-token.js';
import { logger } from '../utils/logger.js';

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  universityId?: string;
  studentId?: string;
  role?: 'CUSTOMER';
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResult = {
  user: SafeUser;
  token: string;
};

export type RegisterResult = {
  user: SafeUser;
  verificationRequired: true;
};

function toSafeUser(user: UserRecord): SafeUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly config: AppConfig,
    private readonly mailer?: Mailer,
  ) {}

  async register(input: RegisterInput): Promise<RegisterResult> {
    if (!this.mailer?.sendEmailVerificationEmail || this.mailer.isConfigured?.() === false) {
      throw new AppError('MAIL_NOT_CONFIGURED', 'Email delivery is not configured yet.', 503);
    }
    const email = input.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new AppError('EMAIL_IN_USE', 'An account with this email already exists.', 409);
    }

    const createInput: CreateUserInput = {
      fullName: input.fullName.trim(),
      email,
      phone: input.phone?.trim(),
      passwordHash: await hashPassword(input.password),
      role: 'CUSTOMER',
      universityId: input.universityId?.trim(),
      studentId: input.studentId?.trim(),
    };
    const user = await this.users.create(createInput);
    const verification = createEmailVerificationToken();
    const expiresAt = new Date(Date.now() + this.config.emailVerificationTtlMinutes * 60 * 1000);
    await this.users.createEmailVerification({ userId: user.id, tokenHash: verification.tokenHash, expiresAt });
    const verificationUrl = `${this.config.clientOrigin.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(verification.rawToken)}`;
    await this.mailer.sendEmailVerificationEmail({
      to: user.email,
      fullName: user.fullName,
      verificationUrl,
      expiresInMinutes: this.config.emailVerificationTtlMinutes,
    });
    return {
      user: toSafeUser(user),
      verificationRequired: true,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    if (!user || !user.isActive || !(await verifyPassword(user.passwordHash, input.password))) {
      throw new AppError('INVALID_CREDENTIALS', 'Email or password is incorrect.', 401);
    }
    if (user.authProvider === 'PASSWORD' && !user.isVerified) {
      throw new AppError('EMAIL_NOT_VERIFIED', 'Please verify your email address before signing in.', 403);
    }
    await this.users.touchLastLogin(user.id);
    return {
      user: toSafeUser(user),
      token: signAuthToken({ userId: user.id, role: user.role }, this.config),
    };
  }

  async loginWithGoogle(profile: GoogleProfile): Promise<AuthResult> {
    const subject = profile.subject.trim();
    const email = profile.email.trim().toLowerCase();
    if (!subject || !email || !profile.emailVerified) {
      throw new AppError('GOOGLE_EMAIL_UNVERIFIED', 'Please use a Google account with a verified email address.', 401);
    }

    let user = await this.users.findByGoogleSubject(subject);
    if (!user) {
      user = await this.users.findByEmail(email);
      if (user) {
        if (!user.isActive) {
          throw new AppError('INVALID_CREDENTIALS', 'Email or password is incorrect.', 401);
        }
        await this.users.linkGoogleAccount(user.id, subject, profile.profileImageUrl);
        user = { ...user, googleSubject: subject, isVerified: true, profileImageUrl: profile.profileImageUrl ?? user.profileImageUrl };
      }
    }

    if (!user) {
      const fullName = profile.fullName.trim() || email.split('@')[0] || 'Google customer';
      user = await this.users.createGoogleUser({
        fullName,
        email,
        passwordHash: await hashPassword(`google:${randomBytes(32).toString('hex')}`),
        googleSubject: subject,
        profileImageUrl: profile.profileImageUrl,
      });
    }

    if (!user.isActive) {
      throw new AppError('INVALID_CREDENTIALS', 'Email or password is incorrect.', 401);
    }
    await this.users.touchLastLogin(user.id);
    return {
      user: toSafeUser(user),
      token: signAuthToken({ userId: user.id, role: user.role }, this.config),
    };
  }

  async me(userId: string): Promise<SafeUser> {
    const user = await this.users.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError('UNAUTHORIZED', 'Your session is invalid or has expired.', 401);
    }
    return toSafeUser(user);
  }

  async verifyEmail(inputToken: string): Promise<SafeUser> {
    const token = inputToken.trim();
    if (!/^[a-f0-9]{64}$/.test(token)) {
      throw new AppError('EMAIL_VERIFICATION_INVALID', 'The email verification link is invalid or expired.', 422);
    }
    const user = await this.users.consumeEmailVerification(hashEmailVerificationSecret(token));
    if (!user) {
      throw new AppError('EMAIL_VERIFICATION_INVALID', 'The email verification link is invalid or expired.', 422);
    }
    return toSafeUser(user);
  }

  async requestEmailVerification(inputEmail: string): Promise<void> {
    const email = inputEmail.trim().toLowerCase();
    const user = await this.users.findByEmail(email);
    if (!user || !user.isActive || user.isVerified) return;
    if (!this.mailer?.sendEmailVerificationEmail || this.mailer.isConfigured?.() === false) {
      throw new AppError('MAIL_NOT_CONFIGURED', 'Email delivery is not configured yet.', 503);
    }

    const verification = createEmailVerificationToken();
    const expiresAt = new Date(Date.now() + this.config.emailVerificationTtlMinutes * 60 * 1000);
    await this.users.createEmailVerification({ userId: user.id, tokenHash: verification.tokenHash, expiresAt });
    const verificationUrl = `${this.config.clientOrigin.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(verification.rawToken)}`;
    await this.mailer.sendEmailVerificationEmail({
      to: user.email,
      fullName: user.fullName,
      verificationUrl,
      expiresInMinutes: this.config.emailVerificationTtlMinutes,
    });
  }

  async requestPasswordReset(inputEmail: string): Promise<void> {
    const email = inputEmail.trim().toLowerCase();
    const user = await this.users.findByEmail(email);
    if (!user || !user.isActive) return;
    if (!this.mailer) {
      throw new AppError('MAIL_NOT_CONFIGURED', 'Email delivery is not configured yet.', 503);
    }

    const link = createResetToken();
    const code = createResetCode();
    const expiresAt = new Date(Date.now() + this.config.passwordResetTtlMinutes * 60 * 1000);
    await this.users.createPasswordReset({ userId: user.id, linkTokenHash: link.tokenHash, codeHash: code.codeHash, expiresAt });
    const resetUrl = `${this.config.clientOrigin.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(link.rawToken)}`;
    try {
      await this.mailer.sendPasswordResetEmail({
        to: user.email,
        fullName: user.fullName,
        code: code.rawCode,
        resetUrl,
        expiresInMinutes: this.config.passwordResetTtlMinutes,
      });
    } catch {
      logger.error('Password reset email delivery failed.');
    }
  }

  async verifyResetCode(inputEmail: string, inputCode: string): Promise<string> {
    const email = inputEmail.trim().toLowerCase();
    const code = inputCode.trim();
    const record = /^\d{6}$/.test(code)
      ? await this.users.findPasswordResetByCode(email, hashResetSecret(code))
      : null;
    if (!record) {
      throw new AppError('RESET_CODE_INVALID', 'The reset code is invalid or expired.', 422);
    }

    const resetToken = createResetToken();
    await this.users.attachCodeResetToken(record.id, resetToken.tokenHash);
    return resetToken.rawToken;
  }

  async resetPassword(inputToken: string, password: string): Promise<void> {
    const token = inputToken.trim();
    if (!token) {
      throw new AppError('RESET_TOKEN_INVALID', 'The reset link is invalid or expired.', 422);
    }
    const record = await this.users.findPasswordResetByTokenHash(hashResetSecret(token));
    if (!record) {
      throw new AppError('RESET_TOKEN_INVALID', 'The reset link is invalid or expired.', 422);
    }
    const consumed = await this.users.consumePasswordReset(record.id, await hashPassword(password));
    if (!consumed) {
      throw new AppError('RESET_TOKEN_INVALID', 'The reset link is invalid or expired.', 422);
    }
  }
}

export { toSafeUser };
