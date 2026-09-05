# University Cafeteria Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a real university cafeteria vertical slice from PostgreSQL schema through customer ordering and shopkeeper order-status operations.

**Architecture:** A TypeScript monorepo contains a Vite React client and an Express API. The API uses routes → middleware → controllers → services → parameterized `pg` repositories, with JWT authentication in HTTP-only cookies and server-owned transaction/price/ownership rules.

**Tech Stack:** React, Vite, TypeScript, React Router, Tailwind CSS, Axios, TanStack Query, React Hook Form, Zod, Lucide React, Node.js, Express, `pg`, bcryptjs, jsonwebtoken, Helmet, CORS, rate limiting, Vitest, Supertest.

**Spec:** `docs/superpowers/specs/2026-09-05-university-cafeteria-vertical-slice-design.md`

## Global Constraints

- The client communicates only with `/api/v1` REST endpoints.
- Never expose `DATABASE_URL`, `JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or `password_hash` to the client.
- Use PostgreSQL through Supabase; do not use MongoDB, Firebase, SQLite, localStorage as a database, or fake analytics/orders/payment success.
- Prices are integer paise; all order totals are recalculated on the server.
- Controllers remain thin; business logic lives in services; SQL lives in repositories.
- Roles are exactly `CUSTOMER`, `SHOPKEEPER`, `SUPER_ADMIN`.
- Public shop/menu reads include only approved shops; shopkeeper operations enforce `shops.owner_id` ownership in the database.
- Single-shop carts reject mixed-shop additions with `CART_SHOP_MISMATCH` until the customer explicitly clears/replaces the cart.
- Allowed order transitions are `PENDING -> ACCEPTED|REJECTED|CANCELLED`, `ACCEPTED -> PREPARING|CANCELLED`, `PREPARING -> READY`, and `READY -> COMPLETED`.
- Features outside this slice are labeled Coming Soon and have no fake mutation behavior.
- Every implementation step follows test-first red → green → refactor and ends with a fresh verification command.

## Files and responsibilities

### Root

- Create: `package.json` — workspace scripts for client/server checks.
- Create: `.gitignore` — secrets, dependencies, builds, logs.
- Create: `.env.example` — safe placeholders for client/server configuration.
- Create: `README.md` — setup, Supabase, migrations, seed, run, API, RBAC, tests, deployment notes.
- Create: `docs/architecture.md` — link to and summarize the approved design.

### Database

- Create: `database/migrations/001_initial_schema.sql` — current-slice enums, tables, constraints, indexes, and trigger helpers.
- Create: `database/schema.sql` — reproducible schema entrypoint.
- Create: `database/seed.sql` — deterministic development users, approved/pending shops, categories, menu, variants, and add-ons.

### Server

- Create: `server/package.json`, `server/tsconfig.json`, `server/vitest.config.ts` — API scripts and TypeScript/test configuration.
- Create: `server/src/config/env.ts` — Zod environment parsing.
- Create: `server/src/config/database.ts` — pooled PostgreSQL connection and transaction helper.
- Create: `server/src/types/domain.ts`, `server/src/types/express.d.ts` — role/status/domain types and authenticated request typing.
- Create: `server/src/utils/app-error.ts`, `server/src/utils/jwt.ts`, `server/src/utils/password.ts`, `server/src/utils/money.ts`, `server/src/utils/pagination.ts`, `server/src/utils/logger.ts` — focused shared utilities.
- Create: `server/src/middleware/authenticate.ts`, `server/src/middleware/require-role.ts`, `server/src/middleware/validate.ts`, `server/src/middleware/error-handler.ts`, `server/src/middleware/not-found.ts`, `server/src/middleware/request-id.ts` — cross-cutting HTTP controls.
- Create: `server/src/validators/auth.ts`, `server/src/validators/shops.ts`, `server/src/validators/cart.ts`, `server/src/validators/orders.ts` — Zod input contracts.
- Create: `server/src/repositories/user-repository.ts`, `shop-repository.ts`, `menu-repository.ts`, `cart-repository.ts`, `order-repository.ts` — parameterized SQL only.
- Create: `server/src/services/auth-service.ts`, `shop-service.ts`, `cart-service.ts`, `order-service.ts` — business rules and transaction orchestration.
- Create: `server/src/controllers/auth-controller.ts`, `shop-controller.ts`, `cart-controller.ts`, `order-controller.ts`, `shopkeeper-order-controller.ts` — request/response adapters.
- Create: `server/src/routes/auth-routes.ts`, `shop-routes.ts`, `cart-routes.ts`, `order-routes.ts`, `shopkeeper-routes.ts`, `index.ts` — versioned route registration.
- Create: `server/src/app.ts`, `server/src/server.ts` — Express app factory and bootstrap.
- Create: `server/tests/unit/auth-service.test.ts`, `order-service.test.ts`, `utils.test.ts`, `middleware.test.ts` — test-first business/security tests.
- Create: `server/tests/api/app.test.ts` — API integration coverage using an injectable repository/database boundary.

### Client

- Create: `client/package.json`, `client/tsconfig.json`, `client/vite.config.ts`, `client/index.html`, `client/src/vite-env.d.ts` — Vite/TypeScript setup.
- Create: `client/src/types/api.ts`, `client/src/api/http.ts`, `client/src/api/auth.ts`, `shops.ts`, `cart.ts`, `orders.ts` — typed client API layer.
- Create: `client/src/lib/query-client.ts`, `client/src/lib/utils.ts` — TanStack Query and UI utilities.
- Create: `client/src/styles/index.css`, `client/tailwind.config.ts`, `client/postcss.config.js` — design tokens and responsive styles.
- Create: `client/src/components/ui/*` — reusable Button, Input, Badge, Modal, LoadingSkeleton, EmptyState, ErrorState, StatusBadge, Toast.
- Create: `client/src/components/food-card.tsx`, `shop-card.tsx`, `search-bar.tsx`, `navbar.tsx`, `footer.tsx`, `order-card.tsx`, `order-timeline.tsx`, `coming-soon.tsx` — composed product components.
- Create: `client/src/features/auth/auth-provider.tsx`, `protected-route.tsx`, `role-route.tsx` — session and route guards.
- Create: `client/src/features/shops/*`, `cart/*`, `orders/*`, `shopkeeper/*` — query/mutation hooks and feature UI.
- Create: `client/src/layouts/public-layout.tsx`, `customer-layout.tsx`, `shopkeeper-layout.tsx` — role-specific shells.
- Create: `client/src/pages/*` — route screens.
- Create: `client/src/routes/router.tsx`, `client/src/App.tsx`, `client/src/main.tsx` — app composition.
- Create: `client/src/tests/*` — focused component/utility tests.

---

### Task 1: Workspace foundation and database contract

**Files:** Root files and database files listed above.

**Interfaces:** Produces workspace scripts, safe env contract, SQL schema, migration, and seed records for all later server/client tasks.

- [ ] **Step 1: Write the failing schema contract test**

Create a Node/Vitest test that reads `database/migrations/001_initial_schema.sql` and asserts the required enums/tables, the exact three roles, key order statuses, unique email/shop slug constraints, `password_hash` non-null, integer paise columns, and core indexes are present.

- [ ] **Step 2: Run the contract test to verify it fails**

Run: `npm test --workspace server -- schema-contract`  
Expected: FAIL because workspace/server/test/schema contract files do not exist yet.

- [ ] **Step 3: Add the workspace, server test harness, env examples, migration, schema, and seed**

Implement the SQL from the design: `users`, `shops`, `categories`, `menu_items`, `item_variants`, `addons`, `menu_item_addons`, `carts`, `cart_items`, `orders`, `order_items`, and `payments`, with constraints and indexes. Seed one customer, one shopkeeper, one admin, one approved shop, one pending shop, and real menu rows using bcrypt hashes generated for documented development passwords.

- [ ] **Step 4: Run the contract test to verify it passes**

Run: `npm test --workspace server -- schema-contract`  
Expected: PASS with all schema assertions green.

- [ ] **Step 5: Commit the foundation**

Run: `git add package.json .gitignore .env.example README.md docs database server/package.json server/tsconfig.json server/vitest.config.ts server/tests/unit/schema-contract.test.ts && git commit -m "feat: add cafeteria workspace and database foundation"`

### Task 2: Express foundation and security middleware

**Files:** `server/src/config/*`, `server/src/utils/app-error.ts`, middleware files, `server/src/app.ts`, `server/src/server.ts`, route health check, and server tests.

**Interfaces:** Produces `createApp(deps?)`, typed `AppError`, env config, `pool`, `asyncHandler`, standard success/error JSON, request IDs, and `/api/v1/health`.

- [ ] **Step 1: Write failing app tests**

Test that `GET /api/v1/health` returns `{ success: true, data: { status: "ok" } }`, an unknown route returns a safe 404 response, and a thrown `AppError` returns its status/code/message without a stack trace.

- [ ] **Step 2: Run the tests and verify failure**

Run: `npm test --workspace server -- app.test.ts`  
Expected: FAIL because `createApp` and the routes do not exist.

- [ ] **Step 3: Implement the minimal app foundation**

Add env validation with server-only secrets, PostgreSQL pool SSL support for Supabase, Helmet, strict configured-origin CORS with credentials, JSON limit, auth-specific rate limiter, request ID, not-found middleware, centralized error handler, and health route. Keep DB construction injectable so API tests can run without a live database.

- [ ] **Step 4: Run focused and full server tests**

Run: `npm test --workspace server -- app.test.ts` then `npm test --workspace server`  
Expected: PASS with no unhandled errors.

- [ ] **Step 5: Commit**

Run: `git add server/src server/tests && git commit -m "feat: add secure express api foundation"`

### Task 3: Shared authentication and RBAC

**Files:** `server/src/utils/jwt.ts`, `password.ts`, auth validators/repository/service/controller/routes, auth middleware, Express types, auth tests.

**Interfaces:** `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`; `authenticate(req,res,next)`; `requireRole(...roles)`; `AuthService` methods returning safe users only.

- [ ] **Step 1: Write failing auth/security tests**

Cover password hashes not returned, registration rejects duplicate/invalid users, login rejects bad credentials and accepts a valid account, JWT claims contain only `sub` and `role` plus standard metadata, `/auth/me` needs a valid cookie, and role middleware returns 403 for disallowed roles.

- [ ] **Step 2: Run tests and verify expected failures**

Run: `npm test --workspace server -- auth-service.test.ts middleware.test.ts`  
Expected: FAIL on missing auth service/middleware behavior.

- [ ] **Step 3: Implement shared auth**

Use bcryptjs with 12 rounds, normalize emails, store JWT in `HttpOnly`, `SameSite=Lax`, `Secure` in production cookies, omit `password_hash` from row mapping, and implement exact role checks. Ensure registration supports customer and shopkeeper roles only when explicitly allowed by the service; never let a public request create a super admin.

- [ ] **Step 4: Run auth tests and verify green**

Run: `npm test --workspace server -- auth-service.test.ts middleware.test.ts`; expected PASS.

- [ ] **Step 5: Commit**

Run: `git add server/src server/tests && git commit -m "feat: add jwt authentication and role authorization"`

### Task 4: Public approved shops and menu API

**Files:** shop/menu repositories, validators, service, controller, routes, and API tests.

**Interfaces:** `GET /api/v1/shops` and `GET /api/v1/shops/:slug/menu` return paginated/filterable real database data; no non-approved shop appears publicly.

- [ ] **Step 1: Write failing shop/menu service tests**

Test approved-only listing, server-side search across shop/menu/category fields, filters for open/vegetarian/spicy/category, pagination metadata, and shop detail rejection for pending/suspended shops.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test --workspace server -- shop-service.test.ts`  
Expected: FAIL because repository/service methods are absent.

- [ ] **Step 3: Implement repositories/services/controllers**

Write parameterized SQL with `LIMIT/OFFSET`, deterministic sorting, approved-shop predicates, category joins, and safe mapping. Keep search on the server; do not send an unbounded catalog to the browser.

- [ ] **Step 4: Run tests and verify green**

Run: `npm test --workspace server -- shop-service.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add server/src server/tests && git commit -m "feat: add approved shop and menu api"`

### Task 5: Customer-facing shell and shop/menu UI

**Files:** client Vite setup, styles, shared components, public/customer layouts, shop feature/pages, router, client tests.

**Interfaces:** Browser routes `/`, `/shops`, `/shops/:slug`, `/login`, `/register`; uses typed API functions and TanStack Query only.

- [ ] **Step 1: Write failing client tests**

Test that shop cards render real fields, loading/empty/error states are visible, search/filter controls update query parameters, and non-auth public routes do not require a session.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test --workspace client -- shops`  
Expected: FAIL because the client files/components do not exist.

- [ ] **Step 3: Implement premium responsive UI**

Create espresso/cream/green design tokens, compact sticky navigation, a food-focused hero with static imagery/CSS depth, featured shop/menu cards, server-backed search/filter, accessible buttons/inputs/status labels, and clear Coming Soon cards for deferred capabilities. Avoid fake counts: visible ratings/reviews use seeded DB data or are omitted.

- [ ] **Step 4: Run client tests and build**

Run: `npm test --workspace client -- shops` then `npm run build --workspace client`  
Expected: PASS and a production bundle in `client/dist`.

- [ ] **Step 5: Commit**

Run: `git add client && git commit -m "feat: add customer shop and menu experience"`

### Task 6: PostgreSQL-backed single-shop cart

**Files:** cart repository/service/controller/routes, cart validators, client cart API/feature/components/pages, server/client tests.

**Interfaces:** `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`, `DELETE /cart`; React Query cart hooks and cart drawer/page.

- [ ] **Step 1: Write failing cart tests**

Test add/update/remove with quantity bounds, cart ownership, item availability, backend line-price calculation, cart shop mismatch error/message, and explicit clear/replace behavior.

- [ ] **Step 2: Run cart tests and verify failure**

Run: `npm test --workspace server -- cart-service.test.ts`  
Expected: FAIL because cart operations are not implemented.

- [ ] **Step 3: Implement cart service and API**

Load/create the customer cart, lock/recheck rows where necessary, derive item price from menu/variant/add-on records, merge equivalent selections deterministically, reject mixed shops with `CART_SHOP_MISMATCH`, and clear shop ID when empty. Never accept price/totals from the request.

- [ ] **Step 4: Implement cart UI and run tests**

Add cart badge, drawer/page, quantity controls, empty/error states, and Replace Cart/Cancel modal. Invalidate cart/menu queries after mutations. Run server cart tests and client cart tests; expected PASS.

- [ ] **Step 5: Commit**

Run: `git add server/src server/tests client && git commit -m "feat: add persistent single-shop cart"`

### Task 7: Transactional cash-on-pickup ordering

**Files:** order repository/service/controller/routes, validators, client checkout/order features/pages, tests.

**Interfaces:** `POST /orders`, `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel`; order service exposes validated transition helpers for later shopkeeper task.

- [ ] **Step 1: Write failing order/price/transaction tests**

Test server ignores client price/subtotal/total, rejects unavailable items/shop, calculates subtotal/tax/total in paise, stores item snapshots, creates a pending cash payment, clears cart, rolls back on simulated write failure, restricts customer reads to own orders, and permits cancellation only from allowed states.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test --workspace server -- order-service.test.ts`  
Expected: FAIL because the transactional order service is absent.

- [ ] **Step 3: Implement the transaction**

Use `withTransaction` and `SELECT ... FOR UPDATE` for the customer's cart; re-fetch every menu/variant/add-on price, calculate integer-paise totals, create order/order items/payment, clear cart, and commit. Use stable order numbers such as `CAF-YYYYMMDD-####` generated inside the transaction-safe database sequence/function.

- [ ] **Step 4: Implement customer checkout/history/detail UI**

Show an authoritative checkout summary, pickup time/special instructions, cash-on-pickup only, confirmation order number, order timeline, history, and retry/error states. Label online payments and other deferred functionality Coming Soon.

- [ ] **Step 5: Run focused tests and client build**

Run: `npm test --workspace server -- order-service.test.ts`; `npm test --workspace client -- orders`; `npm run build --workspace client`  
Expected: PASS and a successful build.

- [ ] **Step 6: Commit**

Run: `git add server/src server/tests client && git commit -m "feat: add transactional cash pickup ordering"`

### Task 8: Shopkeeper authentication and own-shop order board

**Files:** shopkeeper route/controller, order service transition logic, client shopkeeper feature/layout/pages, tests.

**Interfaces:** `GET /shopkeeper/orders`, `PATCH /shopkeeper/orders/:id/status`; `requireRole('SHOPKEEPER')` plus database ownership predicate.

- [ ] **Step 1: Write failing RBAC/ownership/state tests**

Test customer/admin requests receive 403, shopkeeper A cannot read/update shopkeeper B's orders, own-shop list is returned, valid transitions succeed, and invalid transitions including completed/rejected/cancelled reversions fail.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test --workspace server -- shopkeeper-order.test.ts`  
Expected: FAIL because own-shop order operations are absent.

- [ ] **Step 3: Implement server order board and transitions**

Use `authenticate` + `requireRole('SHOPKEEPER')`, resolve the caller's shop from `shops.owner_id`, restrict every query/update to that shop, validate status transitions in the service, and return safe order records. Add rejection from pending and cancellation where the state machine allows it.

- [ ] **Step 4: Implement operational UI**

Create a dense but readable order board grouped by status, clear action buttons only for valid transitions, confirmation for reject/cancel, mobile drawer navigation, loading/empty/error states, and a truthful KPI row sourced from the order-board response. Admin and other operations are Coming Soon.

- [ ] **Step 5: Run tests and build**

Run: `npm test --workspace server -- shopkeeper-order.test.ts`; `npm test --workspace client -- shopkeeper`; `npm run build --workspace client`  
Expected: PASS and successful build.

- [ ] **Step 6: Commit**

Run: `git add server/src server/tests client && git commit -m "feat: add shopkeeper order operations"`

### Task 9: Documentation and production verification

**Files:** `README.md`, `docs/setup.md`, `docs/architecture.md`, `.env.example`, any fixes found by verification.

**Interfaces:** A new developer can configure Supabase, migrate/seed, run both apps, execute tests, and understand RBAC/deferred modules.

- [ ] **Step 1: Write documentation acceptance checks**

Add a script/test that asserts README includes environment variables, migration/seed commands, API base, auth cookie behavior, roles, test command, and the complete Coming Soon list.

- [ ] **Step 2: Run documentation check and identify gaps**

Run: `npm test --workspace server -- docs-contract`; expected initially FAIL if required documentation is absent.

- [ ] **Step 3: Complete setup documentation**

Document the supplied Supabase URI as a local-only configuration value, normalized as `postgresql://postgres:<password>@db...supabase.co:5432/postgres?sslmode=require`, without committing the password. Document `psql -f database/migrations/001_initial_schema.sql` and `psql -f database/seed.sql`, local client/server commands, cookie/CORS requirements, API endpoints, and deployment secret handling.

- [ ] **Step 4: Run the full verification suite**

Run:

```powershell
npm test
npm run build
rg -n "DATABASE_URL|JWT_SECRET|SUPABASE_SERVICE_ROLE_KEY|password_hash" client/src client/dist
git diff --check
```

Expected: all tests pass, both workspaces build, the secret scan finds no secret values in client source/bundle, and `git diff --check` is clean. If a live Supabase connection is available locally, run the migration/seed and a health/API smoke test with the local `.env`; otherwise report that live DB execution remains environment-dependent.

- [ ] **Step 5: Commit the verified documentation/hardening**

Run: `git add README.md docs .env.example && git commit -m "docs: document cafeteria vertical slice setup and boundaries"`

