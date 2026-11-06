# 0049 — Online storefront (server)

Date: 2026-11-06
Status: Accepted

## Context
Change 10 (MVP 1): Public online storefront letting customers browse in-stock products
across all active branches and place pickup orders without pre-payment or registration.

## Decision
- Schema (`storefront.prisma`): singleton `storefront_settings`, `storefront_orders`
  with JSONB specs, and lookup `storefront_order_statuses` (NEW, CONTACTED, DONE,
  CANCELLED). Order status transitions are audited in `storefront_order_status_history`.
- Permissions: `order.read` and `order.manage` seeded for ADMIN and CASHIER.
- Public routes (`/storefront`): `@Public()` endpoints for `/config`, `/products`,
  `/products/:modelId`, and `/orders`. When storefront is disabled, non-config public
  routes return 404. Aggregates stock across all active stores without leaking internal data.
- Security & zero data leakage: responses explicitly select safe fields (no IMEI, serial,
  cost, supplier, grade, or user IDs). Rate limit of 5/min on order submission, plus honeypot.
- Pricing: resolved walk-in (RETAIL) price from pricing module; `null` ("ask") when unset or hidden.
- Staff routes (`/storefront-orders`): scoped strictly to active store (`currentStoreId()`).
  Other branch's order returns 404. State machine: NEW -> CONTACTED -> DONE/CANCELLED.

## Consequences
- Customers can submit orders without auth; staff manage pickup and till sales per branch.
- Stock is never auto-reserved; inventory counts remain accurate and live across all stores.
