# UniEats Cafeteria Discovery Design

**Date:** 2026-09-05  
**Status:** Approved for implementation

## Goal

Make cafeteria discovery useful on every screen size and connect the UI to real server-backed behavior for search, cuisine categories, open/closed state, rating, distance, price, reviews, opening hours, favorites, offers, and menu navigation.

## Scope

- Keep the existing approved-shop and menu model.
- Add public discovery metadata to shops: cuisine labels, distance, price range, opening hours, and offer availability.
- Add customer-facing reviews, favorites, and offers APIs.
- Preserve unauthenticated browsing; favorite/review mutations require a customer session.
- Keep the current React Query and Express/Postgres architecture.

## API behavior

`GET /shops` accepts `search`, `category`, `openOnly`, `minRating`, `maxDistanceKm`, `priceRange`, `offersOnly`, `sort`, `page`, and `limit`. Search matches shop name, description, location, cuisine, and menu item name. Results remain limited to approved shops.

`GET /shops/categories` returns the distinct public cuisine categories used by approved shops.

`GET /shops/:slug` returns the shop, its menu, and public offers/review summary data.

`GET /shops/:slug/reviews` returns paginated public reviews. `POST /shops/:slug/reviews` creates or updates the authenticated customer’s review.

`GET /shops/:slug/offers` returns active offers. `GET /offers` returns active offers across approved shops.

`GET /favorites` returns the authenticated customer’s favorite shops. `POST /favorites/:shopId` adds one and `DELETE /favorites/:shopId` removes one.

## UI behavior

- `/shops` exposes a search field, cuisine chips, open/closed control, rating/distance/price/offers filters, sort, result count, and a clear-filters action.
- Cards show open state, rating/review count, opening hours, distance, price range, offer badge, favorite toggle, and `View menu`.
- `/shops/:slug` shows the existing menu plus hours, distance, price range, offers, favorite action, and reviews.
- Filters are a compact inline toolbar on desktop and a responsive drawer/panel on smaller screens.
- Mobile cards remain one column; tablet and desktop use density appropriate to the available width.
- Exact requested viewport bands are covered with explicit CSS media queries, with a 320px safety band.

## Data and safety

- Distance is represented as a decimal number in kilometers and is currently seeded/configured per cafeteria; no browser geolocation permission is required.
- Price range is a small controlled enum (`BUDGET`, `MID`, `PREMIUM`) rather than arbitrary user input.
- Reviews are constrained to one review per customer per shop, with rating 1–5 and bounded text.
- Offer display is public, but offer creation/management remains outside this slice.

## Verification

- Add server unit/API tests for every new filter and mutation authorization path.
- Add client tests for query-string filter state, card content, favorite behavior, and review/offer rendering.
- Run targeted tests, full tests where currently valid, TypeScript/build checks, and a responsive CSS contract check.
