# features/customers — Customers (wave 4)

Searchable customer list, create dialog, and a details drawer with purchase
history. All **online** (no offline feed).

## Owns
- `/customers` route (perm `customer.read`; create needs `customer.manage`).

## Public API (via the module)
- `customersRoutes`, `customersNavItems` — wired in `app/router/feature_registry.dart`.

## Notes
- There is **no `customers` i18n namespace** — UI reuses `sales.*`/`common.*`
  keys, and the nav label reuses `sales.customersTitle` (no `nav.customers`).
- Creating a customer is **online-only** (no offline handler); the dialog blocks
  when offline.
- `CustomerSale` (purchase-history row) is kept separate from the sales slice's
  `SaleView` so the two slices stay independent.

## Must never
- Write outside this slice.
