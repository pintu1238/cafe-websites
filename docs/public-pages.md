# Public pages and enquiry operations

## Routes

The footer links to `/`, `/menu`, `/shops`, `/about`, `/contact`, `/how-it-works`, `/faqs`, `/offers`, `/support`, `/partner`, `/vendor/login` and `/resources`. Guides have stable URLs at `/resources/:article` and downloadable Markdown copies. Static content routes resolve their own pathname; they do not depend on a nonexistent `:slug` parameter.

Menu and offer pages read the existing catalog APIs. Cart actions use the existing authenticated cart API. Vendor login reuses the session flow and sends only approved `SHOPKEEPER` accounts to the order board; submitting a partnership enquiry never creates or elevates an account.

## Database rollout

Apply migration `005_public_enquiries.sql` before serving the forms. The additive migration is included in `database/schema.sql`. On an existing database, run `node scripts/migrate-public-enquiries.mjs` from the project root, with the intended server-only `DATABASE_URL` configured. The API connection must have insert/update access through the trusted server role; browser clients receive no table access. Keep the database credentials out of all `VITE_*` variables.

`POST /api/v1/enquiries` accepts bounded contact, support or partner submissions. It validates consent, normalizes email addresses, and persists a record before returning a `UE-<uuid>` reference. A repeated request key with the same validated payload returns the same reference; a changed payload with that key returns 409. Storage failures never return a success receipt. The forms retain input after failure and reuse a request key for identical retries within the mounted form.

## Follow-up and privacy

- The three forms save requests. They do **not** send automatic emails, promise a response time, approve partners or open privileged accounts.
- Requests are stored in `public_enquiries` with `NEW`, `IN_PROGRESS` or `RESOLVED` status. Authorized operators can locate a request using the UUID portion of its reference through their existing trusted database tooling. An operator inbox UI is not part of this change.
- Row-level security is enabled with no public read policy. No public inbox or reference-lookup endpoint exposes personal information. Never add an anonymous table read policy to make a client-side inbox work.
- Assign a support owner, mailbox/phone coverage and a retention policy before inviting production enquiries. Limit database access to staff responsible for follow-up.
- The limiter allows ten submissions per IP per 15 minutes in one API process. A horizontally scaled production deployment needs a shared rate-limit store or equivalent gateway protection and correct trusted-proxy configuration.

## Verification

Client integration tests cover exact footer routes, navigation, FAQ search, form success/retry, menu filters/cart and vendor role/session behavior. Server tests cover invalid input, partner validation, storage errors, private-read denial and submission throttling.

For the browser audit, build a same-origin client (PowerShell):

```powershell
$env:VITE_API_BASE_URL='/api/v1'
npm run build
node scripts/verify-footer-pages.mjs
```

The audit uses installed Microsoft Edge in headless mode (`QA_BROWSER_CHANNEL` can select another installed Playwright channel). It serves the built app at an ephemeral local port, uses real read APIs, follows footer links, checks direct routes, FAQ search, guide downloads, responsive layouts and inline phone alignment. Contact/support/partner writes use one database transaction; the audit rolls it back and verifies that no test submissions remain. Do not interrupt the process unnecessarily; PostgreSQL also rolls back an open transaction if its connection closes.

Screenshots are placed in a unique `unieats-footer-qa-*` directory in the system temporary directory. The audit does not send email, place food orders or change existing accounts.
