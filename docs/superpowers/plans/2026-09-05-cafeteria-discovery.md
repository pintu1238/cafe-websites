# Cafeteria Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a functional, responsive UniEats cafeteria discovery experience with backend-backed search, filters, menus, reviews, favorites, opening hours, distances, and offers.

**Architecture:** Extend the existing Express/Postgres repositories and services with a small discovery domain, then expose typed React Query APIs and compose the existing `/shops` and `/shops/:slug` pages from reusable filter, card, review, offer, and favorite components. Keep the active branding work isolated to the homepage/CSS files while the data and shop feature work lands in its own files.

**Tech Stack:** TypeScript, Express, PostgreSQL, Zod, React, React Router, TanStack Query, Tailwind utility classes, CSS media queries, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-05-cafeteria-discovery-design.md`

## Global Constraints

- Preserve existing uncommitted user work; do not reset or overwrite unrelated files.
- Do not change `client/src/pages/home-page.tsx` or `client/src/styles/index.css` while the referenced branding task is active unless the shop feature cannot be implemented without it.
- Keep public browsing available without authentication; protect favorite and review writes with the existing auth middleware and customer role checks.
- Use parameterized SQL and existing response envelopes.
- Use `apply_patch` for edits and run verification before claiming completion.

---

## 1. Extend discovery data contracts and database schema

**Files:** `database/migrations/`, `database/seed.sql`, `server/src/types/domain.ts`, `client/src/types/api.ts`

- [ ] Add public shop metadata fields for `distance_km` and controlled `price_range`.
- [ ] Add normalized shop cuisine categories if the existing categories table cannot safely represent public cuisine labels.
- [ ] Add `shop_reviews`, `favorite_shops`, and `shop_offers` tables with foreign keys, uniqueness, timestamps, active-window indexes, and seed data.
- [ ] Extend server/domain/client types for shop metadata, reviews, offers, favorites, and pagination.
- [ ] Keep migrations additive and idempotent where the repository’s migration convention allows it.

## 2. Implement server-side shop discovery filters

**Files:** `server/src/validators/shops.ts`, `server/src/repositories/shop-repository.ts`, `server/src/services/shop-service.ts`, `server/src/controllers/shop-controller.ts`, `server/src/routes/shop-routes.ts`

- [ ] Validate rating, distance, price range, offers-only, and sort query parameters with bounded values.
- [ ] Return opening hours, distance, price range, cuisine labels, active offer count, and favorite state when a customer is authenticated.
- [ ] Add a categories endpoint that returns distinct approved-shop cuisine categories.
- [ ] Extend SQL filtering/search while preserving approved-shop scoping, pagination, and safe sort mapping.
- [ ] Add review summary and active offers to shop detail responses.

## 3. Add reviews, favorites, and offers server workflows

**Files:** `server/src/repositories/`, `server/src/services/`, `server/src/controllers/`, `server/src/routes/`, `server/src/middleware/`

- [ ] Add repository methods for list/create-or-update reviews, list/add/remove favorites, and list active offers.
- [ ] Add customer-protected routes and use the existing auth context/role guard.
- [ ] Validate review rating/text and shop ownership/state through the service layer.
- [ ] Return consistent `{ success, data }` envelopes and useful 4xx errors.
- [ ] Add unit/API coverage for happy paths, unauthorized requests, duplicate favorites, invalid ratings, and pagination.

## 4. Add typed client API and hooks

**Files:** `client/src/api/shops.ts`, `client/src/api/reviews.ts`, `client/src/api/favorites.ts`, `client/src/api/offers.ts`, `client/src/features/shops/hooks.ts`, `client/src/features/*/hooks.ts`

- [ ] Add typed filter serialization and query keys so changing one filter refreshes results predictably.
- [ ] Add categories, review, favorite, and offers hooks with mutation invalidation for shop lists/detail and favorites.
- [ ] Preserve auth failure behavior so public list/detail pages still render when the user is logged out.
- [ ] Add client tests for request parameters and mutation cache invalidation.

## 5. Build the discovery toolbar and result cards

**Files:** `client/src/pages/shops-page.tsx`, `client/src/components/shop-card.tsx`, new `client/src/components/shop-filters.tsx`, new `client/src/components/cuisine-chips.tsx`, new `client/src/components/favorite-button.tsx`

- [ ] Replace the compact filter row with search, cuisine chips, open/closed, rating, distance, price, offers-only, sort, result count, and clear controls.
- [ ] Sync meaningful filters to the URL so refresh/share preserves the current discovery state.
- [ ] Show loading, error, empty, and active-filter states accessibly.
- [ ] Add card content for rating/reviews, hours, distance, price range, offers, favorite state, and `View menu`.
- [ ] Keep cards keyboard accessible and avoid navigation when toggling a favorite.

## 6. Complete the shop detail experience

**Files:** `client/src/pages/shop-page.tsx`, new review/offer components, existing menu components

- [ ] Add metadata header for hours, distance, rating/reviews, price, favorite, and active offers.
- [ ] Replace the reviews placeholder with real review list, summary, and authenticated review form.
- [ ] Render offers from the API and preserve existing menu/cart behavior.
- [ ] Handle stale/empty review and offer states without breaking menu browsing.

## 7. Apply responsive behavior across requested breakpoints

**Files:** shop feature CSS/module styles and existing shared shop component classes

- [ ] Cover 1680, 1600, 1400, 1300, 1200, 992, 768, 576, 361, 360, and 320px bands.
- [ ] Use a mobile filter panel/drawer, single-column cards below tablet width, and non-overflowing controls at 320px.
- [ ] Check text wrapping, focus states, image aspect ratios, and touch target sizes.
- [ ] Add a CSS contract test for each required media band and component tests for responsive state labels.

## 8. Verify and hand off

- [ ] Run targeted server and client tests for the new discovery slice.
- [ ] Run TypeScript/build checks and distinguish pre-existing failures from regressions.
- [ ] Inspect the active branding task status and avoid conflicting edits before any final responsive polish.
- [ ] Summarize changed files, working endpoints, verification results, and any pre-existing test failures.
