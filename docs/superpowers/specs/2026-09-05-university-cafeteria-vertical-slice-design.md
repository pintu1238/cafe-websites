# University Cafeteria Vertical Slice Design

**Date:** 2026-09-05  
**Scope:** Foundation through shopkeeper order operations  
**Status:** Approved for implementation

## Goal

Build a real end-to-end university cafeteria ordering slice for an empty repository: shared authentication and RBAC, approved-shop/menu discovery, a PostgreSQL-backed single-shop cart, cash-on-pickup checkout, transactional order creation, and shopkeeper-owned order status operations.

The slice must use real Supabase PostgreSQL data and must not present fake analytics, fake orders, fake payment success, or frontend-controlled totals. Features outside this slice are clearly marked as Coming Soon.

## Architecture overview

The repository is a small monorepo with independent client and server applications plus SQL database assets:

```text
client/                 React/Vite customer and shopkeeper UI
server/                 Express REST API and domain services
database/               schema, ordered migrations, and development seed
docs/                   architecture and setup documentation
```

The client communicates only with `/api/v1` REST endpoints. The server is layered as:

```text
routes -> middleware -> controllers -> services -> repositories -> PostgreSQL
```

Controllers translate HTTP to application calls. Services own business rules and transactions. Repositories contain parameterized SQL and map database rows to domain records. Authentication is shared by all roles, with role and ownership checks enforced on the server.

The implementation uses direct `pg` access rather than an ORM so transaction boundaries, row locks, ownership predicates, and SQL constraints remain explicit and reviewable.

## System architecture and data flow

```text
Browser
  | HTTPS, HttpOnly JWT cookie, JSON
  v
Express API (/api/v1)
  | helmet, cors, rate limit, request id, error middleware
  v
Route middleware
  | authenticate -> requireRole -> validate
  v
Thin controllers
  v
Domain services
  | auth, shops, menu, cart, orders, shopkeeper orders
  v
PostgreSQL repositories
  v
Supabase PostgreSQL
```

Client server state is managed with TanStack Query and invalidated after mutations. Authentication state is derived from `/auth/me`; the browser does not store the database URL, JWT secret, service-role key, password hash, or authoritative cart/order totals.

## Folder structure

```text
client/
  src/
    api/                 Axios client and typed endpoint functions
    components/          Shared UI primitives and composed cards
    features/
      auth/              auth forms, session query, protected route
      shops/             listing, details, menu, search/filter
      cart/              cart query, drawer/page, mutations
      orders/            checkout, confirmation, customer history
      shopkeeper/        operational dashboard and order board
    layouts/             public, customer, shopkeeper shells
    pages/               route-level screens
    routes/              router and role guards
    styles/              Tailwind entry and design tokens
    types/               client-safe API/domain types
    lib/                 query client and utility setup
    App.tsx
    main.tsx
  index.html
  package.json

server/
  src/
    config/              environment parsing and database pool
    controllers/         HTTP adapters
    middleware/          auth, role, validation, errors, not-found
    repositories/        parameterized SQL/data access
    routes/              versioned route registration
    services/            business logic and transaction orchestration
    validators/          Zod request schemas
    types/               server domain and Express augmentation types
    utils/               JWT, password, money, pagination, logging
    app.ts               Express app factory
    server.ts            process bootstrap
  tests/                 unit and API-focused tests
  package.json

database/
  schema.sql             complete current-slice schema
  seed.sql               development-only demo users, shops, menus
  migrations/
    001_initial_schema.sql

docs/
  architecture.md
  setup.md
  superpowers/specs/...
  superpowers/plans/...

.env.example
.gitignore
package.json
README.md
```

## Core relational model

```text
users (1) --------< shops (owner_id)
shops (1) --------< categories
shops (1) --------< menu_items >-------- (1) categories
menu_items (1) --< item_variants
shops (1) --------< addons
menu_items >------< addons via menu_item_addons
users (1) -------- (1) carts
carts (1) --------< cart_items >--------- menu_items
users (1) --------< orders >------------- shops
orders (1) -------< order_items >-------- menu_items (nullable reference)
orders (1) ------- (1) payments
```

Core constraints:

- `users.email` is unique and normalized to lowercase by the service.
- `users.role` is a PostgreSQL enum with exactly `CUSTOMER`, `SHOPKEEPER`, `SUPER_ADMIN`.
- Public shop/menu queries only return `shops.status = APPROVED`; suspended/closed shops cannot receive new orders.
- `carts.customer_id` is unique. A cart's `shop_id` is set by the first item and cleared when the last item is removed.
- `cart_items` is unique on `(cart_id, menu_item_id, variant_id, selected_addons_key)` for deterministic line merging.
- Prices are integer paise (`BIGINT`/`INTEGER` where safe) and never floating point.
- Order rows keep `item_name_snapshot`, `unit_price`, `total_price`, selected variant/addon snapshots, and totals independent of later catalog edits.
- `payments.order_id` is unique; the current provider is `CASH_ON_PICKUP` and initial status is `PENDING`.

Future-slice tables (promotions, inventory, reviews, favorites, notifications, reports, audit logs, system settings) are intentionally not exposed in this milestone; the UI labels those areas Coming Soon.

## API design

All responses use:

```json
{ "success": true, "data": {} }
```

Errors use:

```json
{ "success": false, "message": "Human readable message", "code": "ERROR_CODE", "errors": [] }
```

Current routes:

```text
GET    /api/v1/health
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

GET    /api/v1/shops?page=&limit=&search=&openOnly=&category=&sort=
GET    /api/v1/shops/:slug
GET    /api/v1/shops/:slug/menu?search=&category=&vegetarian=&spicy=

GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:id
DELETE /api/v1/cart/items/:id
DELETE /api/v1/cart

POST   /api/v1/orders
GET    /api/v1/orders
GET    /api/v1/orders/:id
POST   /api/v1/orders/:id/cancel

GET    /api/v1/shopkeeper/orders
PATCH  /api/v1/shopkeeper/orders/:id/status
```

List endpoints are paginated and support server-side search/filter/sort. Controllers do not accept price, subtotal, tax, discount, total, customer identity, role, payment status, or shop ownership from the client.

## Authentication and authorization

Registration accepts full name, email, password, and optional university/student identifiers. Passwords are hashed with bcryptjs (12 rounds). Login signs a short-lived JWT containing only `sub`, `role`, and token metadata, then sets it in an HTTP-only, SameSite cookie. Logout clears the cookie. The client uses `withCredentials` and never stores tokens in localStorage.

Middleware sequence:

1. `authenticate` verifies the cookie JWT and loads the active user without `password_hash`.
2. `requireRole(...roles)` enforces the exact role for the route.
3. `validate(schema)` parses body/query/params before controllers run.
4. Service methods enforce ownership and resource visibility using database predicates.

RBAC matrix for this slice:

| Capability | Customer | Shopkeeper | Super Admin |
|---|---:|---:|---:|
| Register/login/me | yes | yes | yes | 
| Browse approved shops/menu | yes | yes | yes |
| Manage own cart/orders | yes | no | no |
| Cancel own eligible order | yes | no | no |
| Read own-shop order board | no | yes | no |
| Change own-shop order status | no | yes | no |
| Read another user's order | no | no | yes |
| Approve a shop | no | no | Coming Soon |

Ownership rules use the authenticated principal plus SQL predicates such as `shops.owner_id = $ownerId`; shopkeeper `:id` parameters are never trusted by themselves. A shopkeeper cannot read or update another shop's order even if they know its UUID.

## Order state machine

Allowed transitions:

```text
PENDING    -> ACCEPTED, REJECTED, CANCELLED
ACCEPTED   -> PREPARING, CANCELLED
PREPARING  -> READY
READY      -> COMPLETED
```

Customer cancellation is allowed only from `PENDING` or `ACCEPTED` and only when the authenticated customer owns the order. Shopkeeper transitions are restricted to their own shop. The service rejects every unlisted transition with `ORDER_INVALID_TRANSITION`; UI button visibility is only a usability layer.

## Cart and checkout behavior

The single-shop cart service creates/loads a persisted cart for the authenticated customer. Adding from a different shop returns `CART_SHOP_MISMATCH` with the message: `Your cart contains items from another shop. Clear the current cart to continue.` The client offers Replace Cart (explicitly clears then adds) or Cancel.

The order service runs a PostgreSQL transaction with a cart row lock:

1. Authenticate a customer and lock their cart.
2. Verify the cart belongs to the customer and has items.
3. Re-load the shop, menu items, variants, and add-ons from PostgreSQL.
4. Verify shop approval/open state and item availability.
5. Recalculate line totals, subtotal, tax, discount, and total using integer paise.
6. Insert the order and immutable order-item snapshots.
7. Insert the `CASH_ON_PICKUP` payment row with `PENDING` status.
8. Delete cart items and clear the cart shop.
9. Commit; any failure rolls back all writes.

The first slice uses a documented configurable tax rate and zero delivery fee/discount. The response includes the authoritative order number and totals returned by the server.

## Storage and out-of-scope boundaries

Supabase Storage is reserved for a later migration. Seed data uses stable remote image URLs only for presentation; no service-role key is sent to the client. Online payments, promotions, inventory, reviews, favorites, notifications, admin modules, advanced analytics, and realtime are shown as Coming Soon and have no fake mutation endpoints.

## Error handling and observability

The API uses a typed `AppError` with stable error codes and HTTP statuses. Zod validation returns field-level errors. The error middleware logs server-side details with a request ID and returns safe human-readable messages without stack traces or database internals. 404, 401, 403, 409, 422, and 500 cases are handled explicitly. The client has an error boundary plus loading, empty, and retry states for every API-driven screen.

Security middleware includes Helmet, strict CORS for the configured client origin, JSON body size limits, request rate limiting for auth routes, cookie flags, parameterized SQL, password hashing, and no secret values in client bundles.

## UI architecture

The customer shell uses a warm espresso/cream/green palette, restrained shadows, compact sticky navigation, responsive card layouts, and subtle transforms. It prioritizes shops, menu search, cart, and current order. The shopkeeper shell uses a denser operational layout with a status board, KPI cards sourced from real queries, and mobile drawer navigation. Dashboard analytics beyond current order counts are Coming Soon.

Routes:

```text
/                         customer home
/shops                    approved shop listing
/shops/:slug              shop detail and menu
/login                    shared login
/register                 shared registration
/cart                     protected customer cart
/checkout                 protected customer checkout
/orders                   protected customer orders
/orders/:id               protected customer order detail
/shopkeeper               protected shopkeeper order board
```

Every interactive control is wired to an API mutation or explicitly labeled Coming Soon. Semantic HTML, labels, visible focus, keyboard-accessible dialogs, alt text, text status labels, and responsive breakpoints from 360px upward are part of the slice.

## Testing strategy

The server has unit tests for password/JWT utilities, role middleware, transition validation, pagination, and price calculation; repository/service tests use a test database or isolated SQL fixtures for ownership and transaction behavior. API tests cover registration/login/me, customer/shopkeeper RBAC, approved-shop visibility, cart shop isolation, server-side price recalculation, order snapshots, cart clearing, and invalid transitions. The client has component tests for auth forms, shop/menu states, cart mismatch handling, checkout summary, and protected routes.

Acceptance cases include:

- Customer to admin/shopkeeper API returns 403.
- Shopkeeper A cannot read/update shopkeeper B's orders or menu.
- Customer cannot read another customer's order.
- Client-supplied totals/prices are ignored or rejected.
- Mixed-shop cart is blocked until explicit replace/clear.
- Completed/rejected/cancelled orders cannot move back into active states.
- Order creation either creates order/payment and clears cart together or creates none.
- Password hashes never appear in API responses.

## Implementation roadmap

1. **Foundation:** workspace scripts, TypeScript configs, env validation, schema/migration/seed, pool, Express app, security/error middleware, health route.
2. **Shared auth/RBAC:** users, bcrypt password flow, JWT cookie, `/auth/me`, guards, role middleware, client session handling.
3. **Shops/menu:** seed-backed public listing/detail/search/filter, customer UI, real loading/error/empty states.
4. **Cart:** persisted cart queries/mutations, shop mismatch/replace flow, authoritative line pricing.
5. **Ordering:** checkout, transactional order service, snapshots, payment record, confirmation/history/detail/cancel.
6. **Shopkeeper operations:** shared login, own-shop order board, validated transitions, operational empty/loading/error states.
7. **Hardening:** run unit/API/build checks, verify secrets/configuration, document setup, and record explicitly deferred modules.

