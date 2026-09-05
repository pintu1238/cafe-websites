# Architecture summary

The current architecture is documented in [the vertical-slice design](superpowers/specs/2026-09-05-university-cafeteria-vertical-slice-design.md). It uses a React/Vite client, an Express/TypeScript REST API, and Supabase PostgreSQL connected through `pg` repositories.

The critical trust boundaries are:

- HTTP-only JWT cookie → `authenticate` → active-user lookup
- `requireRole` → exact role authorization
- shopkeeper user → database `shops.owner_id` ownership predicate
- cart/order requests → database catalog price reload and integer-paise calculations
- checkout → one PostgreSQL transaction that inserts order/items/payment and clears the cart

The full platform's future modules are intentionally staged behind Coming Soon boundaries until their repositories, services, authorization rules, and tests are implemented.
