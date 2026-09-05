# Database and Email Authentication Integration Design

## Goal

Make the existing cafeteria application prove and use its configured PostgreSQL connection at startup, and complete email authentication with SMTP-backed account verification and password recovery.

## Current context

The server already loads the root `.env`, creates a `pg` pool from `DATABASE_URL`, injects PostgreSQL repositories into the API router, and implements password login, JWT cookies, Google OAuth, and password-reset code/link flows. The client already has login, registration, forgot-password, and reset-password screens. This change extends those seams instead of introducing Supabase Auth or a second session system.

## Architecture

The server remains the only component allowed to read `DATABASE_URL`, `JWT_SECRET`, and SMTP credentials. Startup performs a `SELECT 1` readiness check against the configured pool, and the health response reports database readiness without exposing connection details. Existing repository queries continue to use parameterized SQL through the shared pool.

Email registration uses a dedicated, idempotent `email_verification_tokens` table. The server creates a random token, stores only its SHA-256 hash with a short expiry, sends a verification link through the configured SMTP transport, and does not issue an auth cookie until the user verifies the address. Login rejects active but unverified password accounts with a safe, actionable error. Google-created or Google-linked accounts remain verified because Google email verification is already required.

## Server contracts

Configuration adds `EMAIL_VERIFICATION_TTL_MINUTES` with a safe 30-minute default. SMTP uses the existing server-only `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM` values. Missing SMTP credentials produce a safe configuration error; no credential, token, code, or reset URL is logged or returned.

The auth service adds:

- `register(input): Promise<{ user: SafeUser; verificationRequired: true }>` for password accounts.
- `verifyEmail(token): Promise<SafeUser>` for single-use verification tokens.
- `requestEmailVerification(email): Promise<void>` with generic behavior for unknown or already verified accounts.

The API adds:

- `GET /auth/verify-email?token=...`, which consumes a valid token and redirects to the client login page with a success or failure query flag.
- `POST /auth/resend-verification` with `{ email }`, returning a generic accepted response.

Existing password-reset routes remain compatible. `POST /auth/login` rejects unverified password users with `EMAIL_NOT_VERIFIED`; the response does not reveal whether an arbitrary email exists. Registration no longer establishes a session before verification.

## Database migration

Add `database/migrations/003_email_verification.sql` and include it from `database/schema.sql`. The migration creates:

```sql
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Add indexes for active token lookup and recent tokens per user. Token consumption and the associated `users.is_verified = TRUE` update occur in one SQL statement so a token cannot be reused between the two mutations.

## Client behavior

Registration sends the user to `/verify-email?email=...` and explains that the account must be verified. The verification page supports resend and shows safe success/failure states. Login displays a verification-needed message with a resend link when the server returns `EMAIL_NOT_VERIFIED`, and recognizes the success flag after a verification-link redirect. Existing password-reset pages and Google links remain unchanged except for shared copy/error handling.

## Error handling and security

- Normalize emails before every lookup and mutation.
- Generate verification tokens with `randomBytes` and store only SHA-256 hashes.
- Accept each token once and reject expired, malformed, or used tokens with a generic message.
- Keep auth cookies HTTP-only, SameSite=Lax, and Secure in production.
- Keep SMTP, database, JWT, Google, and reset secrets out of all `VITE_*` variables and committed files.
- Return generic resend/reset acceptance responses to prevent account enumeration.
- Keep startup and health failures free of connection strings and provider credentials.

## Testing and verification

Add server unit/API coverage for unverified login rejection, registration verification mail, token consumption, resend behavior, invalid/expired tokens, SMTP configuration errors, and database health wiring. Add client coverage for the verification page and login/resend states. Run focused TDD cycles, server and client type-checks, the full build, the full test suite, and an actual `SELECT 1` connection check against the configured database. The known unrelated responsive-style test failure should be reported separately unless it is directly affected by this change.
