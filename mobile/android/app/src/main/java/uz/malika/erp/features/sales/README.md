# features/sales — POS & Sales slice group

Native port of the web `pages/pos`, `pages/sales`, `pages/customers`,
`widgets/pos-terminal`, `features/checkout`, `features/warranty-lookup`,
`entities/sale`, `entities/customer`. One `FeatureModule` (`SalesFeature`) with
three permission-gated routes.

## Owns
- **POS** (`pos`, `sale.create`): scan IMEIs into a **multi-device cart** (each
  line: editable price + warranty), one shared customer (typeahead search of
  existing, or new inline) + notes, then checkout. The server takes one device
  per sale, so checkout fans the cart into **one `sale.create` per device**
  (`SaleCreate.ops`), each enqueued to the outbox with that device's version as
  `expectedVersion` (ADR 0007); the push drain delivers them. A device already
  carted is rejected on re-scan ("already in cart"); one with a sale still
  waiting in the offline queue gets a distinct "already queued" message. A cross-feature
  preload (inventory/QC "Sell in POS") scans in via `featureNav.consumeArg("pos")`.
  Local 58mm receipt (all lines) + print. Toaster on the result.
- **Sales** (`sales`, `sale.read`): paginated list (`PageState` + load more),
  stats tiles (`/sales/stats`), filters — search, date range (`AppDateRangeField`),
  channel, returned-status, warranty, and cashier (`/users`, shown only with
  `user.read`) — CSV export (`Csv` + share sheet), detail sheet with an **Open
  device** link (`featureNav → Destination.Inventory`), a **View consignment**
  link on B2B sales (`featureNav → Destination.Consignments`), **copy IMEI** and
  a **tappable customer phone** (opens the dialer), server receipt + print,
  returns (`sale.return`, online-only, toaster on success), and warranty lookup
  by IMEI — online via `/sales/warranty/:imei`, **offline** from the cached
  device + latest sale.
- **Customers** (`customers`, `customer.read`): searchable + paginated directory
  (load more) with aggregates, stats tiles (`/customers/stats`), CSV export,
  detail + purchase history, create/edit (`customer.manage`, online-only).

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
auth + sync endpoints. Promote `/sales`, `/customers`, `/devices/by-imei`,
`/sales/stats`, `/customers/stats`, `/users` onto `ApiService` and delete that
builder when convenient.

Two shared touches outside the slice (minimal, flagged here):
- `app/Navigation.kt` now mounts the kit's `ToastHost` once at the app root
  (fed `container.toaster`) — the toaster bus existed but nothing rendered it.
- `i18n/I18n.kt` loads the `customers` namespace (its keys already ship in the
  web JSON for both locales) so the customer stats tiles have labels.

Missing i18n keys (need Gemini): `common.loadMore` (both locales — used by the
kit `LoadMoreFooter`) and `pos.notInStock` (pre-existing gap, shown on re-scan
of a non-stock device). Raw key shows until added.
