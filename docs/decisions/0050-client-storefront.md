# 0050 — Client Online Storefront and Order Processing

Date: 2026-11-06
Status: Accepted

## Context
Customers need a public web catalog to browse multi-branch in-stock devices and place pickup orders without authentication. Staff need an order intake queue scoped to their active store.

## Decision
- **Public Surface (`/shop`, `/shop/:modelId`)**: Placed outside `RequirePermission` and `AppShell`. When storefront is disabled, shows a clean unavailable notice.
- **Unauthenticated HTTP**: Extended `shared/api/http.ts` with `public?: boolean` to omit `Authorization` and `X-Store-Id` headers and ignore 401 redirects.
- **Honeypot & Validation**: Order modal includes bot-trap hidden field (`hp`), validated phone inputs, and dynamically limits branch selection to branches with stock.
- **Staff Orders (`/orders`)**: Guarded by `order.read`. Shows orders for the active branch with status filters, audit history sheet, and status transitions (`order.manage`).
- **Sidebar Badge**: Polls `GET /storefront-orders/stats` to display new orders count on the orders navigation link.
- **Storefront Settings**: Company-wide card on `/settings` with switches, category multi-select, and link copying.

## Consequences
- Public pages never expose staff state, credentials, or internal identifiers.
- Complies with ADR 0048 money display rules.
