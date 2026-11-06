# 0049 — Online storefront (server)

Date: 2026-11-06
Status: Accepted

## Context
Change 10: Public online storefront for browsing in-stock catalog across active
branches and submitting pickup orders without pre-payment or registration.

## Decision
- Schema (`storefront.prisma`): singleton `storefront_settings`, `storefront_orders`
  with JSONB specs, and lookup `storefront_order_statuses` (NEW, CONTACTED, DONE,
  CANCELLED). Transitions audited in `storefront_order_status_history`.
- Permissions: `order.read` and `order.manage` seeded for ADMIN and CASHIER.
- Public routes (`/storefront`): `@Public()` endpoints for `/config`, `/products`,
  `/products/:modelId`, and `/orders`. Disabled storefront returns 404 on non-config.
- Catalog query: DB-level pagination (`take`/`skip`), batch pricing resolution via
  `pricesForUnits` & `pricesForProducts` avoiding N+1 round trips.
- Zero data leakage: safe fields only (no IMEI, serial, cost, supplier, grade, IDs).
- Rate limits: 120/min catalog reads, 5/min order posts, plus honeypot fields.
- Trust proxy (`TRUST_PROXY_HOPS`): set to 1 for Railway reverse proxy so rate limit
  keys on real client IP. Higher hops allow IP spoofing; 0 collapses limits into one bucket.
- Pricing: resolved RETAIL price from pricing module; `null` ("ask") when unset or hidden.
- Staff routes (`/storefront-orders`): scoped strictly to active store (`currentStoreId()`).

## Consequences
- Customers submit orders without auth; staff manage pickup and till sales per branch.
- Stock is never auto-reserved; inventory counts remain accurate across all stores.