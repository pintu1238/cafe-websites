# Google OAuth and Password Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google sign-up/sign-in and Gmail-delivered password recovery to the existing React/Express cafeteria app.

**Architecture:** Keep the existing server-issued `cafeteria_token` JWT cookie. Express owns Google authorization-code exchange, verified-account linking, SMTP delivery, and hashed reset-token lifecycle; React only starts OAuth navigation and submits recovery forms.

**Tech Stack:** React 19, React Router 7, React Hook Form, Express 5, TypeScript, PostgreSQL/Supabase, `google-auth-library`, `nodemailer`, `bcryptjs`, Zod, Vitest, Supertest.

**Spec:** `docs/superpowers/specs/2026-09-05-google-password-auth-design.md`

## Global Constraints

- Keep Google and SMTP credentials server-only; never add them to `VITE_*` variables or committed files.
- Store only SHA-256 hashes of password-reset secrets in PostgreSQL.
- Require `email_verified` from Google before creating or linking an account.
- Use generic forgot-password responses so account existence is not disclosed.
- Preserve HTTP-only, SameSite=Lax cookies and Secure cookies in production.
- Existing registration, password login, `/auth/me`, cart, order, and role behavior must remain compatible.
- Every new behavior must have a test written and observed failing before its production implementation.

### Task 1: Set up feature branch, dependencies, and idempotent schema

**Files:**
- Create: `database/migrations/002_authentication_extensions.sql`
- Modify: `database/schema.sql`
- Modify: `server/package.json`
- Modify: `package-lock.json`
- Modify: `.env.example`
- Modify: `docs/setup.md`

**Interfaces:**
- Produces the `auth_provider` enum, `users.auth_provider`, `users.google_subject`, and `password_reset_tokens` schema consumed by Tasks 2–6.
- Produces server dependency availability for `google-auth-library` and `nodemailer`.

- [ ] **Step 1: Create a feature branch without discarding the existing dirty workspace.**

Run `git switch -c feat/google-password-auth` from the current checkout. If the branch already exists, keep the current checkout and continue on that branch.

- [ ] **Step 2: Add the server dependencies.**

Add `google-auth-library` and `nodemailer` to `server/package.json`, then run `npm install --workspace server` so `package-lock.json` resolves the exact versions.

- [ ] **Step 3: Add the migration.**

Create an idempotent migration that defines `auth_provider` only when absent, adds the two user columns only when absent, creates a partial unique index on non-null `google_subject`, and creates:

```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  link_token_hash TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  code_reset_token_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  code_verified_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Add indexes for `(user_id, created_at DESC)` and active token lookup. Make `auth_provider` default to `PASSWORD`, and leave existing users untouched.

- [ ] **Step 4: Include the new migration and document environment values.**

Add `\i migrations/002_authentication_extensions.sql` to `database/schema.sql`. Add the Google, SMTP, and reset TTL variables from the spec to `.env.example`, with localhost/Gmail defaults that contain no secret values. Explain in `docs/setup.md` that Google Cloud must allow the exact redirect URI and the supplied Gmail app password belongs in the ignored local `.env` only.

- [ ] **Step 5: Run the dependency and schema-independent baseline checks.**

Run `npm run lint --workspace server`. Expected result: the existing server type-check remains clean before feature code is added.

### Task 2: Add configuration, crypto helpers, and repository contracts through tests

**Files:**
- Test: `server/tests/unit/auth-service.test.ts`
- Test: `server/tests/unit/reset-token.test.ts`
- Modify: `server/src/config/env.ts`
- Modify: `server/src/types/domain.ts`
- Create: `server/src/utils/reset-token.ts`
- Modify: `server/src/repositories/user-repository.ts`

**Interfaces:**
- `createResetToken()` returns `{ rawToken: string; tokenHash: string }`.
- `createResetCode()` returns `{ rawCode: string; codeHash: string }`.
- `hashResetSecret(value: string)` returns a lowercase SHA-256 hex digest.
- `UserRepository` gains `findByGoogleSubject`, `linkGoogleAccount`, `createGoogleUser`, `createPasswordReset`, `findPasswordResetByLinkHash`, `findPasswordResetByCode`, `attachCodeResetToken`, `markCodeVerified`, `consumePasswordReset`, and `updatePassword`.

- [ ] **Step 1: Write reset-helper tests first.**

Test that generated tokens and six-digit codes have the required format, hashing the same value is deterministic, hashing different values differs, and generated secrets are not returned in hashed form.

- [ ] **Step 2: Run the focused tests to confirm the expected RED state.**

Run `npm run test --workspace server -- tests/unit/reset-token.test.ts`. Expected result: failure because `server/src/utils/reset-token.ts` does not exist.

- [ ] **Step 3: Implement the minimal reset helpers.**

Use `randomBytes(32).toString('hex')` for tokens, `randomInt(100000, 1000000).toString()` for codes, and `createHash('sha256').update(value).digest('hex')` for hashes.

- [ ] **Step 4: Run the focused tests to confirm GREEN.**

Run `npm run test --workspace server -- tests/unit/reset-token.test.ts`. Expected result: all reset-helper tests pass.

- [ ] **Step 5: Extend config and domain/repository types.**

Add the exact typed config fields from the spec with defaults, add `authProvider` and `googleSubject` to user records, add password-reset record types, and implement the PostgreSQL repository queries with parameterized SQL and `mapUser` updates.

- [ ] **Step 6: Run server lint.**

Run `npm run lint --workspace server`. Expected result: type-check passes with the new interfaces.

### Task 3: Implement Google OAuth adapters and Google account service behavior

**Files:**
- Test: `server/tests/unit/google-auth.test.ts`
- Create: `server/src/services/google-oauth.ts`
- Modify: `server/src/services/auth-service.ts`

**Interfaces:**
- `GoogleAuthProvider.getAuthorizationUrl(state: string): string`.
- `GoogleAuthProvider.exchangeCode(code: string): Promise<GoogleProfile>`.
- `GoogleProfile` contains `subject`, `email`, `fullName`, `profileImageUrl`, and `emailVerified`.
- `AuthService.loginWithGoogle(profile: GoogleProfile): Promise<AuthResult>` creates a customer for a new verified email, links an existing same-email account, or logs in an existing Google-subject account.

- [ ] **Step 1: Write failing Google service tests.**

Cover new verified-account creation, existing Google-subject login, same-email linking, rejection of unverified profiles, and rejection of malformed profiles. Use an in-memory repository and assert the returned user has no password hash and the token contains only normal identity/role claims.

- [ ] **Step 2: Run the focused tests and confirm RED.**

Run `npm run test --workspace server -- tests/unit/google-auth.test.ts`. Expected result: failure because `loginWithGoogle` and `GoogleProfile` are not implemented.

- [ ] **Step 3: Implement Google account behavior.**

Normalize the provider email, reject unverified or empty-email profiles with `AppError`, look up Google subject first, then email, create new users with a random unusable bcrypt password hash and `authProvider: 'GOOGLE'`, link verified same-email accounts, touch last login, and sign the existing JWT.

- [ ] **Step 4: Implement the injectable Google OAuth adapter.**

Use `OAuth2Client.generateAuthUrl` with `openid`, `email`, and `profile`, and use `getToken` plus `verifyIdToken` with the configured client ID. Convert only verified payload fields into `GoogleProfile`; throw safe `AppError` messages for missing configuration, missing ID token, invalid code, or missing required claims.

- [ ] **Step 5: Run focused Google tests and server lint.**

Run `npm run test --workspace server -- tests/unit/google-auth.test.ts` and `npm run lint --workspace server`. Expected result: all focused tests pass and the server type-check is clean.

### Task 4: Implement password reset service and SMTP mailer behavior

**Files:**
- Test: `server/tests/unit/password-reset.test.ts`
- Create: `server/src/services/mailer.ts`
- Modify: `server/src/services/auth-service.ts`

**Interfaces:**
- `Mailer.sendPasswordResetEmail(input: { to: string; fullName: string; code: string; resetUrl: string; expiresInMinutes: number }): Promise<void>`.
- `AuthService.requestPasswordReset(email: string): Promise<void>`.
- `AuthService.verifyResetCode(email: string, code: string): Promise<string>`.
- `AuthService.resetPassword(token: string, password: string): Promise<void>`.

- [ ] **Step 1: Write failing password-reset tests.**

Test that an unknown email produces no mail and no enumeration-specific result, a known active user creates a reset record and sends both link/code data, a valid code returns a reset token, mismatched/expired/used secrets are rejected, and a successful reset hashes the new password and consumes the reset record.

- [ ] **Step 2: Run focused tests and confirm RED.**

Run `npm run test --workspace server -- tests/unit/password-reset.test.ts`. Expected result: failure because reset methods and mailer are not implemented.

- [ ] **Step 3: Implement reset service behavior.**

Generate independent link and code secrets, hash before repository writes, persist an expiry using `PASSWORD_RESET_TTL_MINUTES`, send an absolute client-origin reset URL, verify email/code against an active record, create/store a code-reset token hash when code verification succeeds, and accept either token hash in `resetPassword`. Hash and store the new bcrypt password before atomically marking the record used through the repository.

- [ ] **Step 4: Implement the SMTP mailer.**

Create a Nodemailer transport from server config and send a text-plus-HTML message containing the six-digit code, absolute reset link, expiry, and ignore-if-unrequested warning. Never log credentials, codes, or URLs.

- [ ] **Step 5: Run focused tests and server lint.**

Run `npm run test --workspace server -- tests/unit/password-reset.test.ts` and `npm run lint --workspace server`. Expected result: all reset tests pass and the server type-check is clean.

### Task 5: Add authentication routes, controllers, validation, and API tests

**Files:**
- Test: `server/tests/api/auth.test.ts`
- Modify: `server/src/validators/auth.ts`
- Modify: `server/src/controllers/auth-controller.ts`
- Modify: `server/src/routes/auth-routes.ts`
- Modify: `server/src/routes/index.ts`
- Modify: `server/src/app.ts`

**Interfaces:**
- `GET /api/v1/auth/google` redirects using a state cookie named `google_oauth_state`.
- `GET /api/v1/auth/google/callback?code=...&state=...` sets `cafeteria_token` and redirects to `CLIENT_ORIGIN`.
- JSON routes use `{ email }`, `{ email, code }`, and `{ token, password }` as specified.

- [ ] **Step 1: Add failing API tests.**

Cover Google start redirect/state cookie, callback cookie and client redirect with mocked provider, generic forgot-password response, reset-code validation, successful reset, and rejection of expired/invalid token. Keep the existing registration/login tests unchanged and passing.

- [ ] **Step 2: Run the API auth tests and confirm RED.**

Run `npm run test --workspace server -- tests/api/auth.test.ts`. Expected result: new route tests fail because the routes and controller methods do not exist.

- [ ] **Step 3: Implement validators and controller methods.**

Add Zod schemas for email, six-digit code, and password reset. Implement state generation with `randomBytes`, HTTP-only state cookie validation/clearing, safe callback error redirects, cookie issuance via the existing helper, and the JSON reset endpoints.

- [ ] **Step 4: Wire injectable adapters and rate limiting.**

Allow `createAuthRouter` to accept optional provider/mailer collaborators, defaulting to concrete adapters in production. Add a stricter per-IP forgot-password limiter, then register all routes without changing the existing `/auth/me` middleware.

- [ ] **Step 5: Run API tests and server tests.**

Run `npm run test --workspace server`. Expected result: all server unit and API tests pass.

### Task 6: Add client API methods and recovery/reset pages

**Files:**
- Test: `client/src/tests/auth-pages.test.tsx`
- Modify: `client/src/api/auth.ts`
- Create: `client/src/pages/forgot-password-page.tsx`
- Create: `client/src/pages/reset-password-page.tsx`
- Modify: `client/src/pages/login-page.tsx`
- Modify: `client/src/pages/register-page.tsx`
- Modify: `client/src/App.tsx`

**Interfaces:**
- `forgotPassword(input: { email: string })` returns the generic accepted response.
- `verifyResetCode(input: { email: string; code: string })` returns `{ resetToken: string }`.
- `resetPassword(input: { token: string; password: string })` returns `{ reset: true }`.

- [ ] **Step 1: Write failing client tests.**

Test that login/register render accessible Google links aimed at the API Google route, login renders the forgot-password link, forgot-password transitions from email submission to code entry, and reset-password accepts a query-string token and submits a new password.

- [ ] **Step 2: Run the focused client tests and confirm RED.**

Run `npm run test --workspace client -- src/tests/auth-pages.test.tsx`. Expected result: failure because the routes, API functions, and UI controls are not implemented.

- [ ] **Step 3: Add API helpers and pages.**

Use existing `Input`, `Button`, `getApiError`, and Tailwind styles. Preserve the visual language of the current auth pages, provide `aria-live` status/error text, show generic success copy after requesting a reset, verify code before navigating with the returned token, and read a link token from `useSearchParams`.

- [ ] **Step 4: Add links and routes.**

Add `/forgot-password` and `/reset-password` routes under `PublicLayout`. Use an absolute Google API URL derived from the configured API base URL and append `Continue with Google` to both auth forms.

- [ ] **Step 5: Run focused client tests and client lint.**

Run `npm run test --workspace client -- src/tests/auth-pages.test.tsx` and `npm run lint --workspace client`. Expected result: all focused tests pass and the client type-check is clean.

### Task 7: Document local Gmail/Google setup and run full verification

**Files:**
- Modify: `README.md`
- Modify: `docs/setup.md`
- Modify: `.env.example`

- [ ] **Step 1: Add setup instructions without secrets.**

Document Google Cloud OAuth consent/client setup, authorized redirect URI `http://localhost:4000/api/v1/auth/google/callback`, Gmail app-password SMTP settings, client-origin reset URL behavior, and the production HTTPS requirement. State that the supplied Gmail credential must remain only in the ignored `.env`.

- [ ] **Step 2: Run the complete test suite.**

Run `npm test`. Expected result: server and client suites complete with zero failures.

- [ ] **Step 3: Run the complete build.**

Run `npm run build`. Expected result: server TypeScript compilation and client Vite build both exit 0.

- [ ] **Step 4: Inspect the final diff and secret scan.**

Run `git diff --check`, `git status --short`, and `rg -n "zpaw|pintugupta0999000|SMTP_PASS=.*[^<]" --glob '!package-lock.json' --glob '!.env' .`. Expected result: no whitespace errors and no supplied credential appears in tracked/project files.

- [ ] **Step 5: Report verified status and runtime prerequisites.**

Report the changed files, test/build results, and the two external prerequisites still required for live Google sign-in: configured Google OAuth client credentials and enabled Gmail SMTP/app-password access.
