# University Cafeteria

University Cafeteria is a production-oriented MERN-style university food ordering platform built as a React/Vite + Express/TypeScript monorepo backed by Supabase PostgreSQL. This first slice is intentionally vertical: a customer can discover real approved cafeterias, add menu items to a PostgreSQL cart, place a cash-on-pickup order, and a shopkeeper can advance that order through the validated preparation flow.

## What is live

- Customer registration, login/logout, JWT session cookie, and `/api/v1/auth/me`
- Google sign-up/sign-in with verified-account linking
- Gmail SMTP password recovery with six-digit code and one-time reset link
- Shared role foundation for `CUSTOMER`, `SHOPKEEPER`, and `SUPER_ADMIN`
- Approved shop listing/detail and server-side menu search/filter
- PostgreSQL-backed single-shop cart with server-selected prices
- Transactional cash-on-pickup checkout, tax calculation, payment record, snapshots, and cart clearing
- Customer order history/detail/cancellation for eligible states
- Shopkeeper own-shop order board with `PENDING → ACCEPTED → PREPARING → READY → COMPLETED`
- Helmet, strict CORS, rate limiting, Zod validation, safe errors, request IDs, and password hashing
- Responsive customer UI, operational shopkeeper UI, loading/empty/error states, and accessible status labels

## Coming Soon

Online payments, Promotions, Inventory, Reviews, Favorites, Notifications, Admin modules, advanced analytics, Supabase Storage uploads, and Realtime updates are clearly marked Coming Soon in this slice. Their buttons do not fake mutations or success.

## Stack and architecture

The client uses React, Vite, TypeScript, React Router, Tailwind CSS, Axios, TanStack Query, React Hook Form, Zod, and Lucide React. The server uses Node.js, Express, TypeScript, `pg`, bcryptjs, jsonwebtoken, `google-auth-library`, Nodemailer, Helmet, CORS, express-rate-limit, and Vitest/Supertest.

```text
client (React) → /api/v1 REST → routes → middleware → controllers
                                      → services → repositories → Supabase PostgreSQL
```

SQL is kept in `database/`; business rules live in services; controllers stay thin; repositories contain parameterized SQL. See [the approved design](docs/superpowers/specs/2026-09-05-university-cafeteria-vertical-slice-design.md) and [the implementation plan](docs/superpowers/plans/2026-09-05-university-cafeteria-vertical-slice.md).

## Setup

Requirements: Node.js 22+, npm 10+, and a Supabase PostgreSQL database.

```powershell
npm install
Copy-Item .env.example .env
```

Edit the root `.env` with server-only values:

```dotenv
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
JWT_SECRET=<at-least-32-character-random-secret>
JWT_EXPIRES_IN=2h
TAX_RATE_BPS=500
VITE_API_BASE_URL=http://localhost:4000/api/v1
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:4000/api/v1/auth/google/callback
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=<gmail-sender>
SMTP_PASS=<gmail-app-password>
MAIL_FROM=<gmail-sender>
PASSWORD_RESET_TTL_MINUTES=30
```

The supplied Supabase URI is already configured locally in the ignored `.env` for this workspace. Keep `.env` private and never put `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_SECRET`, `SMTP_PASS`, `SUPABASE_SERVICE_ROLE_KEY`, or password hashes in client code or `VITE_*` variables.

## Database setup

The schema is idempotent and has already been applied to the configured Supabase database for this workspace. For another database, use the Supabase SQL editor or `psql`:

```powershell
psql "$env:DATABASE_URL" -f database/schema.sql
psql "$env:DATABASE_URL" -f database/seed.sql
```

`database/schema.sql` is the `psql` entrypoint. `seed.sql` is development-only and creates:

The base schema is in `database/migrations/001_initial_schema.sql`; `database/migrations/002_authentication_extensions.sql` adds Google identity and password-recovery storage.

- Customer: `student@university.test` / `Student@12345`
- Shopkeeper: `shopkeeper@university.test` / `Cafe@12345`
- Admin: `admin@university.test` / `Admin@12345`

Do not run these development credentials or seed records in production.

## Run

```powershell
# both apps
npm run dev

# or separately
npm run dev --workspace server
npm run dev --workspace client
```

Client: `http://localhost:5173`  
API: `http://localhost:4000/api/v1/health`

## API overview

```text
POST /auth/register
POST /auth/login
GET  /auth/google
GET  /auth/google/callback
POST /auth/forgot-password
POST /auth/verify-reset-code
POST /auth/reset-password
POST /auth/logout
GET  /auth/me

GET  /shops?page=1&limit=12&search=&openOnly=&sort=
GET  /shops/:slug
GET  /shops/:slug/menu?search=&category=&vegetarian=&spicy=

GET    /cart
POST   /cart/items
PATCH  /cart/items/:id
DELETE /cart/items/:id
DELETE /cart

POST /orders
GET  /orders
GET  /orders/:id
POST /orders/:id/cancel

GET   /shopkeeper/orders
PATCH /shopkeeper/orders/:id/status
```

The API returns `{ success, data }` on success and `{ success: false, message, code, errors }` on failure. Client-provided prices, totals, payment status, role, identity, and shop ownership are never authoritative.

## Authentication and RBAC

JWTs are stored in an HTTP-only, SameSite cookie named `cafeteria_token`; React derives the session from `/auth/me` and does not use localStorage as a database. Google OAuth uses a server-side state cookie and only accepts verified Google email identities. Password recovery stores only reset-secret hashes, expires secrets after `PASSWORD_RESET_TTL_MINUTES`, and consumes them after one successful password change. `CUSTOMER` routes own customer carts/orders. `SHOPKEEPER` routes resolve the caller's shop through `shops.owner_id` and restrict every order query/update to that shop. Public catalog reads expose only approved shops. `SUPER_ADMIN` exists in the shared role enum but admin modules are Coming Soon.

### Provider setup

In Google Cloud, create a Web application OAuth client and register `http://localhost:4000/api/v1/auth/google/callback` as an authorized redirect URI. For password recovery, enable Gmail SMTP for the sender account and use a Gmail app password in the ignored `.env`; never commit that value. The email contains a six-digit code and a 30-minute reset link. Production deployments must use HTTPS and register the production callback URI.

## Testing and verification

```powershell
npm test
npm run build
npm run lint
git diff --check
```

The server test suite covers schema contracts, auth cookies/password safety, RBAC, shop visibility, cart price/shop isolation, money/order transitions, and the app error contract. Live smoke verification against Supabase covers approved shop/menu reads, customer login/cart/order creation, cart clearing, shopkeeper status update, and cross-role 403 responses.

## Deployment considerations

Build the client and server separately with `npm run build`. Deploy the server with server-only `DATABASE_URL` and `JWT_SECRET`, set `CLIENT_ORIGIN` to the deployed client origin, and use HTTPS so production cookies can be marked Secure. Do not ship the root `.env`, database password, service-role key, or development seed credentials. Use Supabase's managed backups and a migration runner for schema changes.
