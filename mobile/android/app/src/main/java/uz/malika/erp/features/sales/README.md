# features/sales — POS & Sales slice group

Native port of the web `pages/pos`, `pages/sales`, `pages/customers`,
`widgets/pos-terminal`, `features/checkout`, `features/warranty-lookup`,
`entities/sale`, `entities/customer`. One `FeatureModule` (`SalesFeature`) with
three permission-gated routes.

## Owns
- **POS** (`pos`, `sale.create`): scan IMEIs into a **multi-device cart** (each
  line: editable price + warranty), one shared customer (typeahead search of
  existing, or new inline) + notes, then checkout. A scan (camera, HID wedge, or
  typed + Enter) **never adds silently**: `PosViewModel.scan` resolves the device
  into a `ScanPrompt` and opens the shared `ScanConfirmSheet`; the line is added
  to the cart only on **confirm** (`confirmScan`), and the not-found / duplicate /
  already-queued / not-in-stock reasons are shown inside that sheet (close only)
  instead of a silent row. The server takes one device
  per sale, so checkout fans the cart into **one `sale.create` per device**
  (`SaleCreate.ops`), each enqueued to the outbox with that device's version as
  `expectedVersion` (ADR 0007); the push drain delivers them. A device already
  carted is rejected on re-scan ("already in cart"); one with a sale still
  waiting in the offline queue gets a distinct "already queued" message. A cross-feature
  preload (inventory/QC "Sell in POS") scans in via `featureNav.consumeArg("pos")`,
  which now also opens the confirm sheet.
  Local 58mm receipt (all lines) + print. Toaster on the result.
- **Sales** (`sales`, `sale.read`): paginated list (`PageState` + load more),
  stats (`/sales/stats`) collapsed by default behind one header row ("Umumiy
  sharh" + revenue + chevron, `rememberSaveable`) so the first sale stays above
  the fold. The main screen carries only that header (tiles when expanded),
  an inline `SearchFilterRow` (search + a filter button badged with the active
  non-default filter count) + a CSV-export icon, the list, and a warranty FAB.
  All other filters — date range (`AppDateRangeField`), channel, returned-status,
  warranty, and cashier (`/users`, shown only with `user.read`) — live in
  `SalesFilterSheet` (a shared `FilterSheet`); each applies immediately and reset
  clears everything (`SalesViewModel.clearFilters`). CSV export (`Csv` + share
  sheet). Detail sheet (Warm Card, scrolls: model title, mono IMEI lines with
  copy, channel / returned pills, keyed fact rows with hairlines, then the
  actions — ghost links, secondary Receipt, **destructive** Return, hidden once
  returned; mirrors the iOS `SaleDetailSheet`) with an **Open
  device** link (`featureNav → Destination.Inventory`), a **View consignment**
  link on B2B sales (`featureNav → Destination.Consignments`), **copy IMEI** and
  a **tappable customer phone** (opens the dialer), server receipt + print,
  returns (`sale.return`, online-only, toaster on success), and warranty lookup
  by IMEI — online via `/sales/warranty/:imei`, **offline** from the cached
  device + latest sale.
- **Customers** (`customers`, `customer.read`): searchable + paginated directory
  (load more) with aggregates, compact stats tiles (`/customers/stats`). The main
  screen carries only the tiles, an inline `SearchFilterRow` + a CSV-export icon,
  and the list; has-purchases and sort live in `CustomerFilterSheet` (a shared
  `FilterSheet`), applying immediately with reset via `CustomersViewModel.clearFilters`.
  CSV export, detail + purchase history, create/edit (`customer.manage`, online-only).
  Warm Card (ADR 0022): new-customer and CSV are icon actions beside the search
  row (no FAB); the summary is the `MetricGrid` list-card; rows are cards (name,
  mono phone, purchase count; mono total + warranty pill). Detail and the
  create/edit form are bottom sheets built on shared `FactRow` / hairline rows
  (`CustomerFormSheet` replaced the M3 dialog); labels use `customers.*` keys.

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

The not-in-stock scan reuses the existing `pos.deviceConflict` key (it was
`pos.notInStock`, which never shipped in the JSON and showed the raw key).

Missing i18n keys (need Gemini): `common.loadMore` (both locales — used by the
kit `LoadMoreFooter`). Raw key shows until added.

## Notes
- Date display (`formatDate` / `formatDateTime` / `parseIsoMillis`) moved to
  `shared/lib/DateFmt.kt` so inventory shares it; the slice imports from there.
