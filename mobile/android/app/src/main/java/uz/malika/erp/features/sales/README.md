# features/sales — POS & Sales slice group

Native port of the web `pages/pos`, `pages/sales`, `pages/customers`,
`widgets/pos-terminal`, `features/checkout`, `features/warranty-lookup`,
`entities/sale`, `entities/customer`. One `FeatureModule` (`SalesFeature`) with
three permission-gated routes.

## Owns
- **POS** (`pos`, `sale.create`): scan IMEI → device from local cache (online
  fallback) → cart → optional customer (existing or new) → checkout. Checkout is
  **offline-capable**: it always enqueues a `sale.create` to the outbox
  (baseVersion = device version, ADR 0007); the push drain delivers it. A device
  with a pending queued sale is rejected on re-scan. Local 58mm receipt + print.
- **Sales** (`sales`, `sale.read`): list with channel + date-range filters,
  detail sheet, server receipt + print, returns (`sale.return`, online-only),
  and warranty lookup by IMEI — online via `/sales/warranty/:imei`, **offline**
  from the cached device + latest sale.
- **Customers** (`customers`, `customer.read`): searchable directory with
  aggregates, detail + purchase history, create/edit (`customer.manage`,
  online-only).

## Public API
`SalesFeature` (a `FeatureModule`). Nothing else is imported by other slices.

## Must never
- Import another feature slice, or edit foundation/shell/registry.
- Queue anything but `sale.create` to the outbox. Returns and customer writes
  are online-only and block with a needs-connection message when offline.
- Model or cache cost fields — they are redacted server-side.

## Note for the integrator
`data/SalesApi.kt` builds a slice-local Retrofit (reusing the foundation token /
base-URL / 401 semantics) because the foundation `ApiService` carries only
auth + sync endpoints. Promote `/sales`, `/customers`, `/devices/by-imei` onto
`ApiService` and delete that builder when convenient.
