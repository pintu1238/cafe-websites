# Google OAuth and Password Recovery Design

## Goal

Extend the existing university cafeteria authentication slice with Google sign-up/sign-in and email-based password recovery while preserving the current server-issued JWT cookie session.

## Scope

This change covers:

- Google OAuth 2.0 authorization-code sign-in and first-time account creation.
- Linking a verified Google identity to an existing local account with the same normalized email.
- Password recovery using a short-lived, single-use link and a six-digit code delivered by SMTP.
- Login/register UI actions, forgot-password UI, reset-password UI, validation, rate limiting, documentation, and automated tests.

It does not add a client-side Google SDK, change the order/cart authorization model, or introduce a new session system.

## Architecture

The Express server owns both third-party exchanges and account mutations. The browser navigates to `GET /api/v1/auth/google`; the server creates a state value, stores it in an HTTP-only cookie, redirects to Google, verifies the returned authorization code and ID token, then issues the existing `cafeteria_token` cookie before redirecting to the client origin.

The users table gains a nullable unique Google subject and an authentication-provider marker. Google accounts receive a random unusable password hash so the existing non-null schema and password login path remain intact. A verified Google email may link to an existing local account; unverified provider identities are rejected.

Password recovery uses a dedicated table. The server stores SHA-256 hashes of the link token, code, and any code-exchange token; plaintext credentials are present only in the outbound email or the current HTTPS request. A code verification can issue a second short-lived reset token without invalidating the emailed link. Any successful reset marks the record used and updates the password hash.

## Server contracts

### Configuration

Add server-only settings with safe test defaults:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (defaults to `http://localhost:4000/api/v1/auth/google/callback`)
- `SMTP_HOST` (defaults to `smtp.gmail.com`)
- `SMTP_PORT` (defaults to `465`)
- `SMTP_SECURE` (defaults to `true`)
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM` (defaults to `SMTP_USER`)
- `PASSWORD_RESET_TTL_MINUTES` (defaults to `30`)

The client receives only its existing `VITE_API_BASE_URL`; provider and mail secrets are never exposed through `VITE_*` variables.

### Routes

- `GET /auth/google`: redirect to Google, or return a configuration error when OAuth is not configured.
- `GET /auth/google/callback`: validate state, verify Google identity, set the normal auth cookie, and redirect to the client origin.
- `POST /auth/forgot-password` with `{ email }`: always return the same accepted response; if the account exists and is active, send a code and link.
- `POST /auth/verify-reset-code` with `{ email, code }`: validate the active code and return a short-lived reset token.
- `POST /auth/reset-password` with `{ token, password }`: consume a valid link or code token and update the password.

All JSON mutation routes use the existing success/error envelope and Zod validation. Reset-code and reset-password failures use generic messages. The existing auth rate limiter remains in place, with a stricter forgot-password limiter layered on top.

### Dependencies and boundaries

- `google-auth-library` is used through a small injectable OAuth adapter that exposes authorization URL creation and verified profile exchange.
- `nodemailer` is used through a small injectable mailer adapter.
- `AuthService` receives repository, configuration, and optional OAuth/mailer collaborators so unit tests never call Google or Gmail.
- `UserRepository` gains methods for Google lookup/linking, password replacement, and reset-record lifecycle operations.

## Database migration

Add `database/migrations/002_authentication_extensions.sql`, and include it from `database/schema.sql`. The migration is idempotent and adds:

- `auth_provider` enum with `PASSWORD` and `GOOGLE` values.
- `users.auth_provider` defaulting to `PASSWORD`.
- `users.google_subject` with a partial unique index.
- `password_reset_tokens` with user reference, link/code/code-exchange hashes, expiry, code verification timestamp, used timestamp, and creation timestamp.

## Client behavior

- Login and register show a “Continue with Google” link pointing at the API Google route.
- Login includes a “Forgot password?” link.
- `/forgot-password` accepts an email, confirms the request without account enumeration, and offers code verification.
- `/reset-password?token=...` accepts a reset link directly. Without a token it offers email plus six-digit code verification, then shows the new-password form after receiving a reset token.
- Successful reset navigates to login with a success message; failed requests show accessible inline errors.

## Email content

The reset email includes the six-digit code, an absolute reset URL built from `CLIENT_ORIGIN`, a 30-minute expiry notice, and a warning that the request can be ignored if it was not initiated by the recipient. The message contains no password or database data.

## Security and error handling

- Compare OAuth state and reset hashes using constant-time comparisons where applicable.
- Generate all tokens and codes with Node `crypto.randomBytes`.
- Store only hashes of reset secrets; never log them.
- Require Google `email_verified` and a non-empty email.
- Normalize emails before lookup and mutation.
- Use generic forgot-password responses to prevent account enumeration.
- Mark reset records used atomically before/with password change and reject expired, used, or mismatched tokens.
- Preserve HTTP-only, SameSite=Lax, Secure-in-production auth cookies.
- Do not commit the supplied Gmail credential or any Google secret.

## Testing and verification

Server tests will cover Google account creation/linking, state/profile rejection, generic forgot-password behavior, reset-code verification, token expiry/use, password replacement, route cookies/redirects, and mocked mail delivery. Client tests will cover the auth links and recovery/reset form states. Final verification will run server tests, client tests, full build, and type-check/lint scripts.
