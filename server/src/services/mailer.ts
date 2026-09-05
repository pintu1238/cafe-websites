import nodemailer from 'nodemailer';
import type { AppConfig } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export type PasswordResetEmailInput = {
  to: string;
  fullName: string;
  code: string;
  resetUrl: string;
  expiresInMinutes: number;
};

export type EmailVerificationEmailInput = {
  to: string;
  fullName: string;
  verificationUrl: string;
  expiresInMinutes: number;
};

export type Mailer = {
  sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void>;
  sendEmailVerificationEmail?(input: EmailVerificationEmailInput): Promise<void>;
  isConfigured?(): boolean;
};

export class SmtpMailer implements Mailer {
  private readonly transporter;

  constructor(private readonly config: AppConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: { user: config.smtpUser, pass: config.smtpPass },
    });
  }

  isConfigured(): boolean {
    return Boolean(this.config.smtpUser && this.config.smtpPass && this.config.mailFrom);
  }

  async sendEmailVerificationEmail(input: EmailVerificationEmailInput): Promise<void> {
    if (!this.isConfigured()) {
      throw new AppError('MAIL_NOT_CONFIGURED', 'Email delivery is not configured yet.', 503);
    }
    await this.transporter.sendMail({
      from: this.config.mailFrom,
      to: input.to,
      subject: 'Verify your University Cafeteria email',
      text: [
        `Hi ${input.fullName},`,
        '',
        `Verify your email address here: ${input.verificationUrl}`,
        '',
        `This link expires in ${input.expiresInMinutes} minutes.`,
        'If you did not create this account, you can safely ignore this email.',
      ].join('\n'),
      html: `<p>Hi ${escapeHtml(input.fullName)},</p><p><a href="${escapeHtml(input.verificationUrl)}">Verify your email address</a></p><p>This link expires in ${input.expiresInMinutes} minutes.</p><p>If you did not create this account, you can safely ignore this email.</p>`,
    });
  }

  async sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
    if (!this.isConfigured()) {
      throw new AppError('MAIL_NOT_CONFIGURED', 'Email delivery is not configured yet.', 503);
    }
    await this.transporter.sendMail({
      from: this.config.mailFrom,
      to: input.to,
      subject: 'Reset your University Cafeteria password',
      text: [
        `Hi ${input.fullName},`,
        '',
        `Your password reset code is ${input.code}.`,
        `Reset your password here: ${input.resetUrl}`,
        '',
        `This link and code expire in ${input.expiresInMinutes} minutes.`,
        'If you did not request this, you can safely ignore this email.',
      ].join('\n'),
      html: `<p>Hi ${escapeHtml(input.fullName)},</p><p>Your password reset code is <strong>${escapeHtml(input.code)}</strong>.</p><p><a href="${escapeHtml(input.resetUrl)}">Reset your password</a></p><p>This link and code expire in ${input.expiresInMinutes} minutes.</p><p>If you did not request this, you can safely ignore this email.</p>`,
    });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);
}
