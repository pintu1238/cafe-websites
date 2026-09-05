# Database and Email Authentication Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use the configured PostgreSQL database at server startup and complete SMTP-backed email verification, login gating, resend, and password recovery in the existing cafeteria application.

**Architecture:** Keep the current Express + `pg` repository architecture and server-issued `cafeteria_token` cookie. Add a separate hashed email-verification-token table, extend the existing injectable mailer, and keep all database/SMTP/JWT secrets server-only. The server performs a safe database readiness query before listening and reports readiness from the health endpoint.

**Tech Stack:** React 19, Vite, TypeScript, Express 5, PostgreSQL/Supabase, `pg`, Nodemailer, bcryptjs, Zod, React Hook Form, React Router, Vitest, and Supertest.

**Spec:** `docs/superpowers/specs/2026-09-05-database-email-auth-integration-design.md`

## Global Constraints

- Keep Google and SMTP credentials server-only; never add them to `VITE_*` variables or committed files.
- Store only SHA-256 hashes of email-verification and password-reset secrets in PostgreSQL.
- Require verified email addresses for password login; Google accounts remain verified through the existing verified Google profile flow.
- Preserve HTTP-only, SameSite=Lax cookies and Secure cookies in production.
- Use generic resend and password-reset responses so account existence is not disclosed.
- Use parameterized SQL through the existing repository/pool boundary.
- Every new behavior must have a test written and observed failing before its production implementation.
- Do not alter the existing cart, order, role, Google OAuth, or password-reset contracts except where explicitly required for verification gating.

---

### Task 1: Add database readiness and verification configuration

**Files:**
- Test: `server/tests/api/app.test.ts`
- Test: `server/tests/unit/env.test.ts`
- Modify: `server/src/app.ts`
- Modify: `server/src/server.ts`
- Modify: `server/src/config/env.ts`
- Modify: `.env.example`
- Modify: `docs/setup.md`

**Interfaces:**
- `CreateAppOptions` accepts an optional `database?: Queryable` used only by readiness checks.
- `GET /api/v1/health` returns `{ success: true, data: { status: 'ok', database: 'connected' } }` when a database is supplied and `SELECT 1` succeeds; test-only app instances without a database retain `{ status: 'ok' }`.
- `AppConfig.emailVerificationTtlMinutes` is a positive integer with a 30-minute default.

- [ ] **Step 1: Write a failing health test.**

Add an app test with a fake queryable that records `SELECT 1` and assert the health response reports `database: 'connected'`. Add a second test whose fake query rejects and assert a safe 503 response with no connection-string text.

- [ ] **Step 2: Run the focused health tests and confirm RED.**

Run `npm run test --workspace server -- tests/api/app.test.ts`. Expected: the new database-readiness assertions fail because the app health route is currently static.

- [ ] **Step 3: Implement the minimal readiness wiring.**

Add the optional `database` dependency to `createApp`, execute `await database.query('SELECT 1')` in the health handler, and throw an `AppError` with code `DATABASE_UNAVAILABLE` and status 503 on failure. Pass the real pool from `server/src/server.ts`; keep the no-database test fallback compatible.

- [ ] **Step 4: Make startup verify the configured database before listening.**

Refactor the server bootstrap into an async `start()` function that runs `await pool.query('SELECT 1')` before `app.listen`. On failure, log only a generic startup error and set `process.exitCode = 1`; never print `DATABASE_URL` or the original connection error if it contains credentials.

- [ ] **Step 5: Add and test the verification TTL configuration.**

Add `EMAIL_VERIFICATION_TTL_MINUTES` to the Zod schema, `AppConfig`, `defaultAppConfig`, and `getEnv`. Add the server-only key with value `30` to `.env.example`, and document SMTP credentials plus the verification flow in `docs/setup.md`.

- [ ] **Step 6: Run focused checks.**

Run `npm run test --workspace server -- tests/api/app.test.ts tests/unit/env.test.ts` and `npm run lint --workspace server`. Expected: the new tests and all server type checks pass.

- [ ] **Step 7: Commit the readiness/config slice.**

```powershell
git add server/tests/api/app.test.ts server/tests/unit/env.test.ts server/src/app.ts server/src/server.ts server/src/config/env.ts .env.example docs/setup.md
git commit -m "feat: verify database readiness at startup"
```

### Task 2: Add email-verification schema, token helper, and repository contract

**Files:**
- Test: `server/tests/unit/email-verification.test.ts`
- Test: `server/tests/unit/schema-contract.test.ts`
- Create: `database/migrations/003_email_verification.sql`
- Modify: `database/schema.sql`
- Modify: `server/src/types/domain.ts`
- Create: `server/src/utils/email-verification-token.ts`
- Modify: `server/src/repositories/user-repository.ts`

**Interfaces:**
- `createEmailVerificationToken(): { rawToken: string; tokenHash: string }` returns a 64-character random hex token and its SHA-256 hash.
- `UserRepository.createEmailVerification(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<EmailVerificationRecord>`.
- `UserRepository.consumeEmailVerification(tokenHash: string): Promise<UserRecord | null>` atomically marks a valid token used and sets its user’s `is_verified` flag.
- `EmailVerificationRecord` contains `id`, `userId`, `tokenHash`, `expiresAt`, `usedAt`, and `createdAt`.

- [ ] **Step 1: Write failing token-helper tests.**

Test that generated raw tokens match `/^[a-f0-9]{64}$/`, the stored hash is different from the raw token, hashing is deterministic, and two generated tokens differ.

- [ ] **Step 2: Run the focused token test and confirm RED.**

Run `npm run test --workspace server -- tests/unit/email-verification.test.ts`. Expected: failure because `email-verification-token.ts` does not exist.

- [ ] **Step 3: Implement the minimal token helper.**

Use `randomBytes(32).toString('hex')` and the existing SHA-256 hashing pattern from `server/src/utils/reset-token.ts`; do not log or persist the raw token.

- [ ] **Step 4: Add the migration contract test first.**

Extend the schema contract test to require `email_verification_tokens`, `token_hash`, `expires_at`, `used_at`, the active-token index, and the user foreign key.

- [ ] **Step 5: Run the schema test and confirm RED.**

Run `npm run test --workspace server -- tests/unit/schema-contract.test.ts`. Expected: failure because migration 003 and its schema include do not exist.

- [ ] **Step 6: Add the idempotent migration and schema include.**

Create the table with `gen_random_uuid()`, `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `token_hash TEXT NOT NULL`, `expires_at TIMESTAMPTZ NOT NULL`, nullable `used_at`, and `created_at`. Add indexes on active `token_hash` and `(user_id, created_at DESC)`. Add `\i migrations/003_email_verification.sql` to `database/schema.sql`.

- [ ] **Step 7: Extend domain types and repository methods.**

Add `EmailVerificationRecord` and the two methods to `UserRepository`. Implement row mapping and parameterized PostgreSQL queries. `consumeEmailVerification` must use one SQL statement with a CTE: update one unexpired unused token, then update the matching user’s `is_verified = TRUE`, and return the user columns; return `null` for malformed, expired, or already-used hashes.

- [ ] **Step 8: Run focused tests and type-check.**

Run `npm run test --workspace server -- tests/unit/email-verification.test.ts tests/unit/schema-contract.test.ts` and `npm run lint --workspace server`. Expected: all focused tests pass and the repository compiles.

- [ ] **Step 9: Commit the schema/repository slice.**

```powershell
git add server/tests/unit/email-verification.test.ts server/tests/unit/schema-contract.test.ts database/migrations/003_email_verification.sql database/schema.sql server/src/types/domain.ts server/src/utils/email-verification-token.ts server/src/repositories/user-repository.ts
git commit -m "feat: add email verification token storage"
```

### Task 3: Extend SMTP mailer and AuthService behavior

**Files:**
- Test: `server/tests/unit/auth-service.test.ts`
- Test: `server/tests/unit/email-verification.test.ts`
- Test: `server/tests/unit/password-reset.test.ts`
- Modify: `server/src/services/mailer.ts`
- Modify: `server/src/services/auth-service.ts`
- Modify: `server/src/config/env.ts`

**Interfaces:**
- `Mailer.sendEmailVerificationEmail(input: { to: string; fullName: string; verificationUrl: string; expiresInMinutes: number }): Promise<void>`.
- `AuthService.register(input): Promise<{ user: SafeUser; verificationRequired: true }>` for password registration.
- `AuthService.verifyEmail(token: string): Promise<SafeUser>`.
- `AuthService.requestEmailVerification(email: string): Promise<void>`.

- [ ] **Step 1: Update service fixtures and write failing behavior tests.**

Add an in-memory verification record to the auth-service fixture and tests for: registration creates an unverified user and sends a verification link without an auth token; unverified login returns `EMAIL_NOT_VERIFIED`; valid verification returns a safe user; invalid/expired/used tokens are rejected; resend sends a fresh link for an unverified active account; and unknown/already verified emails produce no email.

- [ ] **Step 2: Run focused tests and confirm RED.**

Run `npm run test --workspace server -- tests/unit/auth-service.test.ts tests/unit/email-verification.test.ts`. Expected: failure because registration still returns a JWT result and the verification service methods/mail interface do not exist.

- [ ] **Step 3: Extend the mailer with verification delivery.**

Add the verification input type and method to `SmtpMailer`. Reuse the existing transport and configuration guard. Send text and escaped HTML containing the recipient name, absolute verification URL, expiry, and ignore-if-unrequested warning. Keep password-reset mail behavior unchanged.

- [ ] **Step 4: Implement registration verification.**

Normalize the email, create the password user with `isVerified: false`, generate/hash a token, persist it with `emailVerificationTtlMinutes`, build `${clientOrigin}/verify-email?token=...`, send the verification mail, and return `{ user: toSafeUser(user), verificationRequired: true }` without signing a JWT.

- [ ] **Step 5: Gate password login and implement verification service methods.**

After password validation, reject inactive or unverified users with safe `AppError('EMAIL_NOT_VERIFIED', 'Please verify your email address before signing in.', 403)`. Implement `verifyEmail` using the repository’s atomic consume method and `requestEmailVerification` with normalized, generic behavior. Keep Google-created/linking users verified and keep reset methods compatible with existing mailer test doubles by making the new mailer member optional only where test fixtures do not use registration.

- [ ] **Step 6: Run focused tests and existing auth tests.**

Run `npm run test --workspace server -- tests/unit/auth-service.test.ts tests/unit/email-verification.test.ts tests/unit/password-reset.test.ts` and `npm run lint --workspace server`. Expected: all focused auth tests pass, including existing password-reset behavior.

- [ ] **Step 7: Commit the service/mailer slice.**

```powershell
git add server/tests/unit/auth-service.test.ts server/tests/unit/email-verification.test.ts server/tests/unit/password-reset.test.ts server/src/services/mailer.ts server/src/services/auth-service.ts server/src/config/env.ts
git commit -m "feat: require verified email for password auth"
```

### Task 4: Add verification/resend routes and API coverage

**Files:**
- Test: `server/tests/api/auth.test.ts`
- Modify: `server/src/validators/auth.ts`
- Modify: `server/src/controllers/auth-controller.ts`
- Modify: `server/src/routes/auth-routes.ts`
- Modify: `server/src/routes/index.ts`

**Interfaces:**
- `GET /api/v1/auth/verify-email?token=<64 hex chars>` consumes a token and redirects to `${CLIENT_ORIGIN}/login?verified=1` or `${CLIENT_ORIGIN}/login?error=email_verification_failed`.
- `POST /api/v1/auth/resend-verification` accepts `{ email }` and returns `202 { success: true, data: { accepted: true } }`.
- Registration returns `201 { success: true, data: { user, verificationRequired: true } }` and does not set `cafeteria_token`.

- [ ] **Step 1: Write failing API tests.**

Add tests for registration response/cookie behavior, unverified login rejection, valid verification redirect, invalid verification redirect, and generic resend response using injectable in-memory service/repository/mailer fixtures. Preserve existing Google and password-reset API tests.

- [ ] **Step 2: Run the focused API tests and confirm RED.**

Run `npm run test --workspace server -- tests/api/auth.test.ts`. Expected: new assertions fail because the controller and routes do not expose verification behavior.

- [ ] **Step 3: Add validation schemas.**

Add a strict `resendVerificationSchema` with normalized email and a strict query-token validation path requiring exactly 64 lowercase hex characters. Keep malformed requests inside the existing validation/error envelope.

- [ ] **Step 4: Implement controller and route behavior.**

Do not set an auth cookie in registration. Add resend handling with status 202. Add the verification GET handler that calls `service.verifyEmail`, clears no auth cookie, and redirects only to the configured client origin with fixed query flags; catch all verification errors and redirect to the generic failure flag.

- [ ] **Step 5: Wire the production mailer and service unchanged.**

Keep `createAuthRouter` injectable for tests, and ensure `createApiRouter` passes the real `SmtpMailer` into `AuthService`. No SMTP or database secret may cross the response boundary.

- [ ] **Step 6: Run all server tests and type-check.**

Run `npm run test --workspace server` and `npm run lint --workspace server`. Expected: all existing and new server tests pass.

- [ ] **Step 7: Commit the API slice.**

```powershell
git add server/tests/api/auth.test.ts server/src/validators/auth.ts server/src/controllers/auth-controller.ts server/src/routes/auth-routes.ts server/src/routes/index.ts
git commit -m "feat: expose email verification endpoints"
```

### Task 5: Add client verification flow

**Files:**
- Test: `client/src/tests/auth-pages.test.tsx`
- Modify: `client/src/api/auth.ts`
- Modify: `client/src/lib/errors.ts`
- Create: `client/src/pages/verify-email-page.tsx`
- Modify: `client/src/pages/login-page.tsx`
- Modify: `client/src/pages/register-page.tsx`
- Modify: `client/src/App.tsx`

**Interfaces:**
- `register()` exposes `{ user, verificationRequired }` from the API response.
- `resendVerification(input: { email: string })` calls `/auth/resend-verification`.
- `/verify-email?email=...` renders the verification instructions and resend form.
- `/login?verified=1` renders a success status; `EMAIL_NOT_VERIFIED` renders a resend-verification action.

- [ ] **Step 1: Write failing client tests.**

Add tests that registration navigates to `/verify-email?email=...` after a verification-required response, the verification page submits the normalized email to `resendVerification`, login displays the success message for `verified=1`, and an `EMAIL_NOT_VERIFIED` API error shows a resend link. Keep the existing Google and password-reset tests unchanged.

- [ ] **Step 2: Run the focused client tests and confirm RED.**

Run `npm run test --workspace client -- src/tests/auth-pages.test.tsx`. Expected: failure because the verification API method/page and new login/register behavior do not exist.

- [ ] **Step 3: Add the client API method and verification page.**

Implement `resendVerification` using the existing Axios response-unwrapping helper. Build an accessible page with an email field, generic accepted status, inline error handling, and links back to sign in/register. Do not put the verification token into React state beyond the server-managed browser redirect; the page is for resend/instructions.

- [ ] **Step 4: Update register and login states.**

After registration, route to `/verify-email?email=${encodeURIComponent(email)}` when `verificationRequired` is true. Read the login query flags, show a safe verified-success message, and when a new `getApiErrorCode` helper reads `EMAIL_NOT_VERIFIED` from the Axios response, render a link to the resend page with the attempted email in query state.

- [ ] **Step 5: Register the route and run client checks.**

Add the `/verify-email` route to `App.tsx`, then run `npm run test --workspace client -- src/tests/auth-pages.test.tsx` and `npm run lint --workspace client`. Expected: focused tests and client type-check pass.

- [ ] **Step 6: Commit the client slice.**

```powershell
git add client/src/tests/auth-pages.test.tsx client/src/api/auth.ts client/src/pages/verify-email-page.tsx client/src/pages/login-page.tsx client/src/pages/register-page.tsx client/src/App.tsx
git commit -m "feat: add email verification screens"
```

### Task 6: Apply the database migration and perform live integration verification

**Files:**
- Modify only the configured Supabase database through the migration SQL; do not add secrets to source control.

- [ ] **Step 1: Confirm the root `.env` remains ignored and secret-free in tracked files.**

Run `git check-ignore -q .env` and `git grep -n -E 'DATABASE_URL=|SMTP_PASS=|JWT_SECRET=' -- ':!docs/superpowers/specs/**' ':!docs/superpowers/plans/**'` without printing `.env` contents. The first command must succeed and the second must not return credentials.

- [ ] **Step 2: Apply the ordered schema to the configured database.**

Use a short Node/`pg` command that loads the root `.env`, reads `database/schema.sql` plus migration files in order, connects with `DATABASE_URL`, executes `SELECT 1`, applies migration 003, and prints only a success marker and row counts. Do not print the URL, password, email credentials, token values, or query errors containing connection strings.

- [ ] **Step 3: Verify database objects without exposing data.**

Run parameterized metadata queries to confirm `email_verification_tokens` exists, its active-token index exists, and the `users.is_verified` column is present. Report only boolean/object-name status.

- [ ] **Step 4: Run final application verification.**

Run `npm run build`, `npm run lint`, `npm run test`, and `git diff --check`. The build, lint, and server tests must pass. If the known unrelated client responsive-style test remains the only client failure, report it explicitly and do not claim the full suite passes.

- [ ] **Step 5: Review the final diff and status.**

Run `git status --short` and `git diff --stat HEAD~6..HEAD` or an equivalent scoped diff review. Confirm no `.env`, generated `dist`, or secret-bearing file was staged, and that all application changes are limited to the approved integration.

## Self-Review Checklist

- [ ] Every new production method has a test that failed before implementation.
- [ ] Migration 003 is included from `database/schema.sql` and is idempotent.
- [ ] Registration cannot issue an auth cookie before verification.
- [ ] Verification token consumption atomically verifies the user and invalidates the token.
- [ ] Password login rejects unverified accounts without account-enumerating details.
- [ ] Resend and reset responses remain generic for unknown accounts.
- [ ] SMTP/database/JWT/Google credentials remain server-only.
- [ ] Live `SELECT 1` and schema metadata checks run against the configured database.
- [ ] The unrelated responsive-style baseline failure is separated from auth verification results.
