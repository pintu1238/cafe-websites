# UniEats — Campus Food Operations SaaS

> Campus food operations, unified.

UniEats is a production-oriented cafeteria commerce platform for colleges and universities. It gives students a faster way to discover food, place pickup orders, and follow order progress, while giving cafeteria partners a focused operational workspace for accepting, preparing, and completing those orders.

This is not a static cafeteria website. UniEats is an extensible campus food operations layer: a shared digital experience for students, cafeteria teams, and the institution that owns the campus ecosystem.

## The institutional opportunity

Campus dining is a daily, high-frequency service. Students need confidence that a cafeteria is open, the menu is current, the price is accurate, and the order will be ready when they arrive. Cafeteria teams need a simple queue that reduces confusion during peak hours. College management needs a platform foundation that can grow into visibility, controls, and measurable service quality.

UniEats brings those needs into one product surface:

| Stakeholder | Value delivered |
| --- | --- |
| Students | Discover nearby cafeterias, browse menus, save favourites, review experiences, build a cart, and order for pickup. |
| Cafeteria partners | Receive structured orders, move them through a clear preparation workflow, and operate from a dedicated shopkeeper board. |
| College management | Establish one consistent campus dining experience with a foundation for vendor governance, analytics, offers, and future multi-campus expansion. |
| IT and operations teams | Work with a typed React/Express/PostgreSQL stack, explicit role boundaries, transactional checkout, and deployment-ready configuration. |

## Product snapshot

- **Customer experience:** responsive web application for desktop, tablet, and mobile screens.
- **Operational model:** cafeteria discovery, menu browsing, pickup ordering, and shopkeeper order fulfilment.
- **Authentication:** email/password, Google OAuth integration, email verification, password reset, HTTP-only JWT session cookie, and role-aware access control.
- **Commerce foundation:** server-authoritative menu pricing, integer-paise calculations, variants/add-ons support, cart persistence, cash-on-pickup checkout, order history, and cancellation.
- **Campus discovery:** categories, availability/open status, ratings, reviews, favourites, offers, location context, and estimated preparation time.
- **Deployment posture:** local development workflow plus a Vercel-ready build path for the React application and Express API adapter.

## What students can do

UniEats is designed around the real campus decision cycle: *What is open? What is nearby? What do I want? Can I trust the price? When will it be ready?*

- Explore popular cafeterias near campus.
- Filter by category, cuisine, availability, rating, and price context.
- Open a cafeteria profile with menu categories, recommended items, reviews, offers, operating hours, and location details.
- Search and filter menu items.
- Save favourite cafeterias.
- Add menu items, variants, and supported add-ons to a persistent cart.
- Review an order before checkout with a clear total.
- Place pickup orders using the current cash-on-pickup flow.
- View order history and order detail.
- Cancel an eligible order.
- Track the operational status as the cafeteria team progresses the order.
- Use the experience comfortably across ultra-wide desktop, desktop, laptop, tablet, and mobile breakpoints.

## What cafeteria partners can do

The shopkeeper experience turns incoming demand into a manageable preparation queue.

- View incoming cafeteria orders in a dedicated order board.
- See order details, customer context, line items, totals, and payment method.
- Move orders through controlled status transitions:

  `PENDING → ACCEPTED → PREPARING → READY → COMPLETED`

- Reject or cancel orders where the workflow allows it.
- Refresh the operational board on a short polling interval for a practical first release.
- Keep ownership scoped to the cafeteria assigned to the authenticated shopkeeper.

Menu administration, shop settings, shopkeeper notifications, and deeper operational analytics are intentionally staged as expansion modules so they can be implemented with the same permission and audit model.

## Product modules

### Student storefront

The student-facing experience includes the dashboard, cafeteria directory, cafeteria detail pages, menu discovery, cart, checkout, orders, order detail, favourites, offers, reviews, profile entry points, and supporting content pages.

### Cafeteria discovery

Discovery is built for a campus environment rather than a generic restaurant marketplace. The experience can communicate open/closed state, campus location, distance context, cuisine, ratings, review count, preparation time, price range, offers, and student-friendly categories.

### Order and pickup workflow

The current checkout is intentionally simple and operationally realistic for an institution pilot: students place a pickup order and pay cash on pickup. The backend reloads catalog prices and calculates totals server-side before writing an order, order items, and payment record in a database transaction.

### Shopkeeper operations

Each cafeteria partner receives a focused operational view rather than a general-purpose admin console. The first workflow is deliberately easy to learn during busy service periods: accept, prepare, mark ready, and complete.

### Institutional expansion layer

The platform is structured to add institutional controls without rewriting the core student experience:

- vendor onboarding and approval;
- campus-wide promotions and offer governance;
- menu and availability management;
- inventory and stock visibility;
- online payments and payment reconciliation;
- realtime order notifications;
- service-level and revenue analytics;
- multi-campus tenancy and white-label branding;
- institutional reporting and role-based administration.

## Role model

| Role | Current responsibility | Access boundary |
| --- | --- | --- |
| Customer / Student | Discover, order, review, favourite, and manage personal orders | Own profile, cart, favourites, reviews, and orders |
| Shopkeeper / Cafeteria partner | Operate the assigned cafeteria order queue | Only orders belonging to owned cafeteria records |
| Super admin | Platform governance foundation | Reserved role for future institutional controls and administration |

The permission model is enforced in the API, not only in the interface. UI visibility improves usability; server-side authentication, role checks, ownership predicates, and database constraints provide the actual boundary.

## End-to-end order journey

```text
Student opens UniEats
        ↓
Finds an open cafeteria near campus
        ↓
Browses menu, variants, add-ons, reviews, and offers
        ↓
Adds items to a persistent cart
        ↓
Server reloads prices and calculates the order total
        ↓
Student confirms pickup order
        ↓
Cafeteria accepts → prepares → marks ready
        ↓
Student collects the order and pays on pickup
        ↓
Order is completed and remains available in history
```

## Capability status

### Available in this release

- Responsive student dashboard and shared dashboard shell.
- Cafeteria list and cafeteria detail views.
- Menu categories, item search, recommendation sections, dietary filters, and offers.
- Reviews and favourites API flows.
- Email/password authentication.
- Google OAuth route integration.
- Email verification and password reset flows.
- Anonymous-safe session bootstrap through `GET /api/v1/auth/me`.
- Persistent cart with quantity updates and removal.
- Server-side price reload and integer-paise money calculations.
- Cash-on-pickup checkout with transactional order creation.
- Order history, order detail, and eligible order cancellation.
- Shopkeeper order board and controlled status transitions.
- Approved-host image proxy for remote cafeteria imagery.
- Rate limiting, security headers, structured request logging, input validation, and database-backed persistence.
- Responsive layouts for the requested desktop, laptop, tablet, and mobile ranges.

### Expansion-ready next modules

These are intentionally separated from the current vertical slice so college teams can evaluate the working product honestly and plan the next commercial phase:

- Razorpay or Stripe payment capture and reconciliation.
- Cafeteria menu editing, item availability, variants, add-ons, and bulk updates.
- Inventory, stock alerts, and kitchen capacity controls.
- Realtime push notifications for students and shopkeepers.
- Super-admin console for vendor approval, campus policy, user support, and moderation.
- Analytics dashboards for order volume, peak periods, fulfilment time, revenue, and cafeteria performance.
- Object storage for managed food imagery and media uploads.
- Multi-campus tenancy, institution branding, configurable policies, and subscription/billing operations.

## SaaS readiness view

| Layer | Current position | Commercial implication |
| --- | --- | --- |
| Product | Working student-to-cafeteria ordering vertical slice | Suitable for a controlled campus pilot and stakeholder demonstrations |
| Operations | Shopkeeper order board with explicit state transitions | Provides a practical adoption path for cafeteria teams |
| Security | JWT session handling, role checks, ownership checks, validation, rate limits, and secure headers | Establishes a responsible baseline for institutional review |
| Data | PostgreSQL schema with indexed operational entities and transactional checkout | Supports reliable reporting and future integrations |
| Expansion | Payment, inventory, admin, notifications, analytics, and multi-campus seams identified | Allows phased investment instead of a rewrite |
| Enterprise go-live | Requires institution-specific hardening, support processes, backups, monitoring, and policy configuration | Clear pilot-to-production checklist for procurement and IT teams |

## Security and trust model

UniEats treats the browser as an untrusted client and keeps business-critical decisions on the server.

- Authentication is established through an HTTP-only JWT cookie.
- Protected routes resolve the active user from the database.
- Role checks are enforced in API middleware.
- Shopkeeper actions include a database ownership predicate for the assigned cafeteria.
- Catalog prices are reloaded from the database during checkout; client totals are not trusted.
- Monetary values are represented as integer paise to avoid floating-point rounding errors.
- Order creation writes the order, order items, payment record, and cart cleanup in one PostgreSQL transaction.
- Zod validation protects request boundaries.
- Helmet, CORS configuration, rate limiting, and structured logging are included in the API foundation.
- Remote image proxying is restricted to the approved `images.unsplash.com` host and returns a cross-origin resource policy compatible with the separate Vite client and API origins.
- Secrets, service-role keys, SMTP credentials, and database credentials belong only in environment configuration and must never be committed.

For a real institutional deployment, add HTTPS-only cookies, production secret rotation, database backups and restore drills, centralized monitoring, error alerting, support escalation, and an explicit data-retention policy before opening the system to the full campus.

## Technical architecture

```text
┌──────────────────────────────────────────────────────────────┐
│ React + Vite student and shopkeeper application              │
│ React Router · TanStack Query · React Hook Form · Zod client  │
└──────────────────────────────┬───────────────────────────────┘
                               │ REST / JSON + HTTP-only cookie
┌──────────────────────────────▼───────────────────────────────┐
│ Express 5 + TypeScript API                                  │
│ auth · discovery · cart · orders · shopkeeper · images       │
│ auth middleware · roles · ownership · validation · limits    │
└──────────────────────────────┬───────────────────────────────┘
                               │ pg connection pool / transactions
┌──────────────────────────────▼───────────────────────────────┐
│ Supabase PostgreSQL                                           │
│ users · shops · categories · menu · carts · orders · payments │
└──────────────────────────────────────────────────────────────┘
```

### Repository layout

```text
.
├── client/                 # React/Vite frontend
│   ├── public/              # Static assets and public files
│   └── src/                 # Pages, components, API clients, styles, tests
├── server/                 # Express/TypeScript backend
│   ├── src/                 # Routes, controllers, services, repositories
│   └── tests/               # API and server regression tests
├── database/                # PostgreSQL schema and development seed data
├── docs/                    # Architecture, setup, plans, and product notes
├── scripts/                 # Deployment/build preparation helpers
├── .env.example             # Environment contract
├── vercel.json              # SPA rewrite and deployment configuration
└── package.json             # Workspace scripts
```

## Core data model

The schema is organized around campus identities, cafeteria ownership, catalog management, and order execution.

| Domain | Main records |
| --- | --- |
| Identity | `users`, authentication provider, verification state, reset state, role, university/student identifiers |
| Cafeteria | `shops`, status, owner, hours, location, rating, preparation estimate |
| Catalog | `categories`, `menu_items`, `item_variants`, `addons`, `menu_item_addons` |
| Discovery | reviews, favourite cafeterias, shop offers |
| Commerce | `carts`, `cart_items`, `orders`, `order_items`, `payments` |
| Operations | order status, payment status, shopkeeper ownership, operational indexes |

Money is stored as integer paise. The schema also includes indexes for active users, shop ownership/status, available menu items, customer order history, shop order queues, and order status filtering.

## API surface

The API is versioned under `/api/v1`. Successful responses use a consistent `{ success, data }` shape; failures use `{ success: false, message, code, errors? }`.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/google`, `GET /auth/google/callback`, `POST /auth/forgot-password`, `POST /auth/verify-reset-code`, `POST /auth/reset-password`, `POST /auth/logout`, `GET /auth/me` |
| Discovery | `GET /shops`, `GET /shops/categories`, `GET /shops/:slug`, `GET /shops/:slug/menu`, `GET /shops/:slug/reviews`, `POST /shops/:slug/reviews`, `GET /offers` |
| Favourites | `GET /favorites`, `POST /favorites/:shopId`, `DELETE /favorites/:shopId` |
| Media | `GET /images?url=...` for approved remote image hosts |
| Cart | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`, `DELETE /cart` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel` |
| Shopkeeper | `GET /shopkeeper/orders`, `PATCH /shopkeeper/orders/:id/status` |

## Getting started for development

### Prerequisites

- Node.js 22 or newer.
- npm 10 or newer.
- A Supabase PostgreSQL project or another PostgreSQL-compatible database.
- SMTP credentials for email verification and password reset during development.
- Optional Google OAuth credentials for Google sign-in testing.

### Install

```bash
npm install
```

### Configure environment

Copy the environment contract and fill in the values for your local environment:

```bash
cp .env.example .env
```

At minimum, configure:

```dotenv
VITE_API_BASE_URL=http://localhost:4000/api/v1
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
SERVER_ORIGIN=http://localhost:4000
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
JWT_SECRET=<long-random-secret>
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-app-password>
MAIL_FROM=<verified-sender>
```

The complete variable list, including Google OAuth, Supabase storage placeholders, tax configuration, and token TTLs, is maintained in [`.env.example`](.env.example).

### Initialize the database

Apply the schema in [`database/schema.sql`](database/schema.sql) to the configured PostgreSQL database. Development seed data can be applied only in a non-production environment.

The API checks database connectivity before listening, so a missing or invalid `DATABASE_URL` is surfaced early during startup.

### Run the platform

```bash
npm run dev
```

This starts:

- the Express API at `http://localhost:4000`;
- the Vite client at `http://localhost:5173`.

For Google OAuth in local development, use:

```text
http://localhost:4000/api/v1/auth/google/callback
```

## Quality gates

Run the workspace checks from the repository root:

```bash
npm test
npm run lint
npm run build
```

For the Vercel deployment preparation flow:

```bash
npm run vercel-build
```

The test suites cover server API behavior, authentication and authorization boundaries, checkout calculations, image proxy behavior, responsive styling contracts, and client-side utilities.

## Deployment notes

The repository includes a Vercel-ready path that builds the client and prepares its output for the Express adapter. The SPA rewrite keeps client-side routes working while API requests under `/api/v1` remain server-handled.

Before a college-wide launch:

1. Use a production PostgreSQL project with automated backups and a tested restore process.
2. Set `NODE_ENV=production`, a strong rotated `JWT_SECRET`, production origins, and HTTPS.
3. Configure secure SMTP delivery and a verified sender domain.
4. Register the production Google OAuth callback if Google sign-in is enabled.
5. Keep Supabase service-role credentials server-only.
6. Replace development seed accounts and sample data.
7. Add monitoring for API errors, database health, order failures, and email delivery.
8. Define campus support ownership, cafeteria onboarding, refund policy, and data retention.
9. Complete the institution-specific admin, payment, notification, and reporting requirements before broad rollout.

## Recommended college rollout

### Phase 1 — Controlled pilot

Launch with one campus, a small group of cafeteria partners, cash-on-pickup, and a clearly defined support owner. Measure student adoption, order completion, preparation time, and cafeteria queue health.

### Phase 2 — Operational scale

Add vendor onboarding, menu administration, availability controls, stock visibility, institutional offers, notifications, and service analytics. Use the data to improve menus and peak-hour staffing.

### Phase 3 — Campus platform

Introduce online payment and reconciliation, multi-campus tenancy, white-label branding, advanced reporting, institutional administration, and commercial billing where required.

This sequencing lets an institution buy a useful product now while retaining a credible path to a complete campus dining platform.

## Documentation

- [Architecture overview](docs/architecture.md)
- [Local setup guide](docs/setup.md)
- [Database schema](database/schema.sql)
- [Development seed data](database/seed.sql)
- [Client application](client/)
- [Server application](server/)

## Commercial positioning

UniEats can be presented to college management as a campus service platform, not only as a food-ordering interface. Its strongest differentiators are:

- one familiar digital front door for every participating cafeteria;
- a low-friction pickup workflow suited to student schedules;
- an operational queue that cafeteria teams can adopt quickly;
- controlled pricing and transactional order records;
- a clear role model for students, partners, and future administrators;
- an extensible foundation for payments, analytics, inventory, notifications, and multi-campus growth.

The product is ready to demonstrate as a serious pilot foundation. Enterprise-wide rollout should be paired with the production hardening and institutional controls listed above.

## License and ownership

This repository is a private product codebase. Add the institution-specific commercial license, support terms, SLA, privacy notice, and data-processing terms before external distribution or procurement review.
