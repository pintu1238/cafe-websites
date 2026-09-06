# UniEats footer pages implementation plan

Goal: every footer destination has a useful, responsive page and actionable controls. Phone and number remain in a single contact row.

Architecture: React Router public pages share a portal visual system. The existing content API supplies editorial content; menu/offers use real discovery APIs. Contact, support and partner forms submit validated enquiries to a private PostgreSQL table, returning a reference only after persistence. Vendor login reuses shared authentication and respects roles.

Research (6 September 2026):
- https://www.cafecoffeeday.com/ — separate menu, cafe locator, customer care and business entry points.
- https://www.panerabread.com/en-us/company/ordering-help.html — explain pickup, account and ordering steps with actionable destinations.
- https://www.starbucks.com/contact/ — distinguish customer care from partnership enquiries.

Adapt these patterns, not their brand copy, policies, payment promises or imagery.

1. Fix static content routes and provide About, Contact, How It Works, FAQs, Support, Partner and Resources page variants. Cover static paths in integration tests.
2. Add dedicated /menu with shop selection, query filters and cart actions; /vendor/login with role-aware sign-in; resource articles at /resources/:article.
3. Add /enquiries API, strict validation, rate limiting, durable idempotent persistence and additive migration 005. Forms show pending/error/success states and preserve data on failure. No email is sent by this flow.
4. Update footer links and contact rows. Shared public pages get breadcrumbs, responsive typography, keyboard-accessible controls, loading/error/empty states and clear next actions.
5. Verify form submissions, FAQ search, menu actions, vendor routing, every footer destination, build/type checks, and representative mobile/desktop layouts.

Operational boundary: new enquiries are stored for authorized operator follow-up; no response-time promise or automatic partner approval. Apply the additive migration on deployment. Never expose submitted enquiries through a public read endpoint.

## Verification record

- All 12 footer links followed in a real browser; direct public routes and missing-resource handling checked.
- 132 layouts checked: 11 pages at 1920, 1680, 1600, 1400, 1300, 1200, 992, 768, 576, 390, 360 and 320px. No horizontal overflow, clipped checked controls or misaligned footer phone row.
- FAQ search, empty recovery, resource download, and Contact/Support/Partner saves verified. Real PostgreSQL submissions and idempotency/conflict checks ran inside a rolled-back transaction; zero QA rows remained.
- Client suite: 62 tests passed. Server suite: 70 passed, with one unrelated README phrase-contract failure (`tests/unit/docs-contract.test.ts`); the ten enquiry API tests passed.
- Production build passed with the existing large-bundle warning. New schema migration applied to the configured database and included in the fresh-install entrypoint. Operations and rollout notes are in `docs/public-pages.md`.
