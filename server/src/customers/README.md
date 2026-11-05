# customers

B2C customer directory (PRD Module 3). Owns the `customers` table. Purchase
aggregates are **derived from sales, never stored**.

## HTTP

- `GET /customers` (`customer.read`) → `CustomerPage` — paginated management list.
  Query: `search` (name/phone, insensitive), `hasPurchases` (`true|false`),
  `sort` (`recent|name`, default `recent`), `page`, `pageSize` (default 20).
- `GET /customers/lookup?q=` (`customer.read`) → `CustomerView[]` — top-10 typeahead
  for POS checkout (no aggregates).
- `GET /customers/stats` (`customer.read`) → `CustomerStats` — `{ total, newThisMonth,
  withPurchases, repeatBuyers }`.
- `GET /customers/:id` (`customer.read`) → `CustomerListItem` (404 if missing).
- `GET /customers/:id/sales` (`customer.read`) → `SaleView[]` — newest first
  (delegates to `SalesService`; cost/profit fields redacted per permission).
- `POST /customers` (`customer.manage`) `{ name, phone?, notes?, priceLevelCode?,
  standingDiscountPercent? }` → `CustomerView`.
- `PATCH /customers/:id` (`customer.manage`) same optional fields → `CustomerView`.

`CustomerView` carries `priceLevelCode` (default `RETAIL`, validated against
active price levels) and `standingDiscountPercent` (2-dp string) — the till's
default level and discount ceiling for this customer (ADR 0034).

`CustomerListItem` = `CustomerView` + `{ purchaseCount, totalSpent, lastPurchaseAt,
activeWarranties, returnsCount }`.

## Decisions

- Aggregates come from `SalesService.listByCustomer` per customer and are reduced
  in the service (`lib/customer-aggregates.ts`). N+1 by design; fine at single-shop
  scale. Upgrade path: a batch aggregate method on `SalesService`.
- `stats` reads only each customer's own `sales` relation count — no sale-table query.
- Phones are normalized to `+998XXXXXXXXX` (`lib/customer-phone.ts`); the `@unique`
  phone column + a pre-check raise `409` on duplicates.
- `/:id/sales` lives here (customer sub-resource) and injects `SalesService`;
  `SalesModule` never imports this module, so there is no cycle.

## Must never

- Hold sale/warranty logic — that is `sales`. Store a derivable aggregate.
- Reach into another module's repository.

## Open questions

- Soft-delete/deactivate is **left out**: the `customers` schema has no `deletedAt`
  and no PRD/ADR mandate. Add a column + migration if the PRD calls for it.
