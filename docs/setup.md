# Local setup

1. Install Node.js 22+ and npm 10+.
2. Run `npm install` from the repository root.
3. Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, `SMTP_USER`, and `SMTP_PASS`. Keep `SERVER_ORIGIN` aligned with the API URL used in verification emails.
4. Apply `database/schema.sql` to Supabase PostgreSQL; it includes the base schema and authentication extensions migration.
5. Apply `database/seed.sql` only in a development database.
6. Run `npm run dev`. The API checks the PostgreSQL connection before it starts listening.

The server loads `.env` from the server workspace or its parent workspace. The client receives only `VITE_API_BASE_URL`; all database and JWT secrets stay server-side. Supabase PostgreSQL connections use TLS through the server pool.

## Useful checks

```powershell
Invoke-RestMethod http://localhost:4000/api/v1/health
npm test
npm run build
```

The live demo accounts are documented in the root README and should be replaced before production deployment.

## Google sign-in and Gmail password recovery

Create a Google OAuth 2.0 Web application client and add this exact local redirect URI:

```text
http://localhost:4000/api/v1/auth/google/callback
```

Put the client ID and secret in the server-only `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` variables. Do not put either value in a `VITE_*` variable.

For email authentication and password recovery, enable SMTP access for the sending Gmail account and create an app password. Set `SMTP_USER`, `SMTP_PASS`, and optionally `MAIL_FROM` in the ignored local `.env`; `SMTP_PASS` must never be committed. The app sends a verification link when a password account is created, plus a six-digit reset code and reset link for password recovery. For production, use HTTPS and set `GOOGLE_REDIRECT_URI` to the registered production callback URL.
