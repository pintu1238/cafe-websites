import type { Queryable } from '../config/database.js';
import type { CreateGoogleUserInput, CreateUserInput, EmailVerificationRecord, PasswordResetRecord, Role, UserRecord, UserRepository } from '../types/domain.js';

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  auth_provider: 'PASSWORD' | 'GOOGLE';
  google_subject: string | null;
  role: Role;
  profile_image_url: string | null;
  university_id: string | null;
  student_id: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
};

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    authProvider: row.auth_provider,
    googleSubject: row.google_subject,
    role: row.role,
    profileImageUrl: row.profile_image_url,
    universityId: row.university_id,
    studentId: row.student_id,
    isActive: row.is_active,
    isVerified: row.is_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
  };
}

const userColumns = `id, full_name, email, phone, password_hash, auth_provider, google_subject,
  role, profile_image_url, university_id, student_id, is_active, is_verified,
  created_at, updated_at, last_login_at`;

type ResetRow = {
  id: string;
  user_id: string;
  link_token_hash: string;
  code_hash: string;
  code_reset_token_hash: string | null;
  expires_at: Date;
  code_verified_at: Date | null;
  used_at: Date | null;
  created_at: Date;
};

type EmailVerificationRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
};

function mapReset(row: ResetRow): PasswordResetRecord {
  return {
    id: row.id,
    userId: row.user_id,
    linkTokenHash: row.link_token_hash,
    codeHash: row.code_hash,
    codeResetTokenHash: row.code_reset_token_hash,
    expiresAt: row.expires_at,
    codeVerifiedAt: row.code_verified_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
  };
}

function mapEmailVerification(row: EmailVerificationRow): EmailVerificationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
  };
}

export class PgUserRepository implements UserRepository {
  constructor(private readonly db: Queryable) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.db.query<UserRow>(
      `SELECT ${userColumns}
         FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const result = await this.db.query<UserRow>(
      `SELECT ${userColumns}
         FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    const result = await this.db.query<UserRow>(
      `INSERT INTO users (full_name, email, phone, password_hash, auth_provider, google_subject, role, profile_image_url, university_id, student_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${userColumns}`,
      [input.fullName, input.email, input.phone ?? null, input.passwordHash, input.authProvider ?? 'PASSWORD', input.googleSubject ?? null, input.role, input.profileImageUrl ?? null, input.universityId ?? null, input.studentId ?? null],
    );
    const row = result.rows[0];
    if (!row) throw new Error('User insert did not return a row.');
    return mapUser(row);
  }

  async findByGoogleSubject(subject: string): Promise<UserRecord | null> {
    const result = await this.db.query<UserRow>(
      `SELECT ${userColumns} FROM users WHERE google_subject = $1 LIMIT 1`,
      [subject],
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async createGoogleUser(input: CreateGoogleUserInput): Promise<UserRecord> {
    return this.create({
      ...input,
      role: 'CUSTOMER',
      authProvider: 'GOOGLE',
      profileImageUrl: input.profileImageUrl ?? undefined,
    });
  }

  async linkGoogleAccount(id: string, googleSubject: string, profileImageUrl?: string | null): Promise<void> {
    await this.db.query(
      `UPDATE users
          SET google_subject = $2,
              profile_image_url = COALESCE($3, profile_image_url),
              is_verified = TRUE
        WHERE id = $1`,
      [id, googleSubject, profileImageUrl ?? null],
    );
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [id]);
  }

  async createPasswordReset(input: { userId: string; linkTokenHash: string; codeHash: string; expiresAt: Date }): Promise<PasswordResetRecord> {
    await this.db.query(
      `UPDATE password_reset_tokens
          SET used_at = NOW()
        WHERE user_id = $1 AND used_at IS NULL`,
      [input.userId],
    );
    const result = await this.db.query<{
      id: string;
      user_id: string;
      link_token_hash: string;
      code_hash: string;
      code_reset_token_hash: string | null;
      expires_at: Date;
      code_verified_at: Date | null;
      used_at: Date | null;
      created_at: Date;
    }>(
      `INSERT INTO password_reset_tokens (user_id, link_token_hash, code_hash, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, link_token_hash, code_hash, code_reset_token_hash,
                 expires_at, code_verified_at, used_at, created_at`,
      [input.userId, input.linkTokenHash, input.codeHash, input.expiresAt],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Password reset insert did not return a row.');
    return mapReset(row);
  }

  async findPasswordResetByLinkHash(tokenHash: string): Promise<PasswordResetRecord | null> {
    const result = await this.db.query<ResetRow>(
      `SELECT id, user_id, link_token_hash, code_hash, code_reset_token_hash,
              expires_at, code_verified_at, used_at, created_at
         FROM password_reset_tokens
        WHERE link_token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1`,
      [tokenHash],
    );
    return result.rows[0] ? mapReset(result.rows[0]) : null;
  }

  async findPasswordResetByCode(email: string, codeHash: string): Promise<PasswordResetRecord | null> {
    const result = await this.db.query<ResetRow>(
      `SELECT reset.id, reset.user_id, reset.link_token_hash, reset.code_hash,
              reset.code_reset_token_hash, reset.expires_at, reset.code_verified_at,
              reset.used_at, reset.created_at
         FROM password_reset_tokens reset
         JOIN users ON users.id = reset.user_id
        WHERE users.email = $1 AND reset.code_hash = $2
          AND reset.used_at IS NULL AND reset.expires_at > NOW()
        ORDER BY reset.created_at DESC LIMIT 1`,
      [email, codeHash],
    );
    return result.rows[0] ? mapReset(result.rows[0]) : null;
  }

  async findPasswordResetByTokenHash(tokenHash: string): Promise<PasswordResetRecord | null> {
    const result = await this.db.query<ResetRow>(
      `SELECT id, user_id, link_token_hash, code_hash, code_reset_token_hash,
              expires_at, code_verified_at, used_at, created_at
         FROM password_reset_tokens
        WHERE used_at IS NULL AND expires_at > NOW()
          AND (link_token_hash = $1 OR code_reset_token_hash = $1)
        ORDER BY created_at DESC LIMIT 1`,
      [tokenHash],
    );
    return result.rows[0] ? mapReset(result.rows[0]) : null;
  }

  async attachCodeResetToken(id: string, tokenHash: string): Promise<void> {
    await this.db.query(
      `UPDATE password_reset_tokens SET code_reset_token_hash = $2, code_verified_at = NOW()
        WHERE id = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [id, tokenHash],
    );
  }

  async markCodeVerified(id: string): Promise<void> {
    await this.db.query(
      `UPDATE password_reset_tokens SET code_verified_at = NOW()
        WHERE id = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [id],
    );
  }

  async consumePasswordReset(id: string, passwordHash: string): Promise<boolean> {
    const consumed = await this.db.query<{ id: string }>(
      `WITH valid_reset AS (
         SELECT user_id
           FROM password_reset_tokens
          WHERE id = $1 AND used_at IS NULL AND expires_at > NOW()
          FOR UPDATE
       ), updated_user AS (
         UPDATE users
            SET password_hash = $2, updated_at = NOW()
          WHERE id IN (SELECT user_id FROM valid_reset)
          RETURNING id
       )
       UPDATE password_reset_tokens
          SET used_at = NOW()
        WHERE id = $1 AND EXISTS (SELECT 1 FROM updated_user)
        RETURNING id`,
      [id, passwordHash],
    );
    return Boolean(consumed.rows[0]);
  }

  async createEmailVerification(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<EmailVerificationRecord> {
    await this.db.query(
      `UPDATE email_verification_tokens
          SET used_at = NOW()
        WHERE user_id = $1 AND used_at IS NULL`,
      [input.userId],
    );
    const result = await this.db.query<EmailVerificationRow>(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, token_hash, expires_at, used_at, created_at`,
      [input.userId, input.tokenHash, input.expiresAt],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Email verification insert did not return a row.');
    return mapEmailVerification(row);
  }

  async consumeEmailVerification(tokenHash: string): Promise<UserRecord | null> {
    const result = await this.db.query<UserRow>(
      `WITH consumed_token AS (
         UPDATE email_verification_tokens
            SET used_at = NOW()
          WHERE id = (
            SELECT id
              FROM email_verification_tokens
             WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
             ORDER BY created_at DESC
             LIMIT 1
          )
            AND used_at IS NULL
            AND expires_at > NOW()
          RETURNING user_id
       )
       UPDATE users
          SET is_verified = TRUE, updated_at = NOW()
         FROM consumed_token
        WHERE users.id = consumed_token.user_id
        RETURNING ${userColumns}`,
      [tokenHash],
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }
}
