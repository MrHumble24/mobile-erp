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
- Payment accounts (`shared/payments`): checkout shows the Cash/Card/Split
  control; the chosen cart-level split is fanned across the cart lines by
  `PaymentSplit.allocate` and ridden into each `sale.create` payload (online and
  offline). Sale detail + receipt show the `payments` lines (empty → nothing);
  the return dialog says the refund returns to those accounts (`sales.refundGoesBack`).
- The return dialog caps the refund at what was paid (sum of the sale's `payments`,
  else `salePrice`); over the cap it shows `sales.refundTooHigh` and blocks submit,
  matching the server's 400 (ADR 0028).

## Serial units (ADR 0029)
- POS resolves and sells a serial unit exactly like a phone: `ScannedDevice.code`
  keys the cart; `SaleCreate.payload` sends `imei` **or** `serialNumber` (one), and
  the offline queue carries whichever was scanned (`PosRepository.codeOf`). The
  receipt, sales list and detail (`catalog.unitCode` label when serial) show the
  unit's `code` via the shared `UnitCode` helper. `SaleDto.device` is nullable so a
  sale whose device row is gone degrades (blank code) instead of failing the list.

## Quantity products (ADR 0030)
- The POS cart mixes phones, serial units and quantity products. `CartLine` is a
  sealed type (`Unit` / `Quantity`); `totalPrice` sums each line's `lineTotal`.
  The scan field resolves any code via `GET /scan/:code` (offline: the device
  cache, then the product cache) — a unit opens the confirm sheet as before, a
  barcode adds a quantity line (re-scan raises the qty), and a typed name falls
  back to `GET /stock?search=` with a pick sheet. A quantity line has a stepper, a
  per-piece price (defaulting to `salePrice`) and a line total; it warns, never
  blocks, when the qty exceeds stock (`catalog.belowZero`). Checkout fans one
  `sale.create` per line (`SaleCreate.ops`): a quantity op sends `modelId` +
  `quantity` + the line total, no warranty, no version. Split is allocated line by
  line in cart order via `PaymentSplit.allocate`.
- Decoding: `SaleDto.device` is null for a quantity sale, which carries `model` +
  `quantity`. `Sale.isQuantity`/`quantity` drive the list, detail, receipt and CSV
  to show the product and `× qty` instead of a unit code; return works unchanged
  (the server restores stock and ignores the device status).

## Till catalog mode (ADR 0031, Change 5)
- A two-way `SegmentedControl` at the top of the till — **Scan** (today's screen,
  `ScanModePanel`) and **Catalog** (`CatalogModePanel`). The mode is remembered on
  the device (`SecureStore` key `pos_mode`). Both modes feed one cart in
  `PosViewModel`, so switching keeps it.
- Catalog = a search field (name / model code / storage), category chips
  (`TabChips`, online only — names are not cached), and a 2-column grid
  (`CatalogGrid`) of product cards drawn from `GET /catalog` (`TillCatalogRepository`,
  online) or the offline Room cache (`OfflineCatalog.build`). Each card shows the
  picture (`shared/ui/ProductImage`, or a neutral placeholder), name, in-stock
  count and price (per-piece for quantity, a min–max range for units).
- Tapping a card applies the pure tap rules (`lib/CardTap.resolveCardTap`): a
  quantity product → `addProduct`; a unit product → fetch its in-stock units
  (`GET /catalog/:modelId/units` or offline), drop any already in the cart, then
  add the single one (`addUnitFromCatalog`, which re-resolves it by code for its
  live version) or open the `UnitPickerSheet`. A unit already carted is never
  offered again.
- On a phone the cart stays reachable via a persistent `CartBar` (line count +
  total, the one orange pressable thing) that opens `CartSheet` — the same
  `PosCartList` + `PosCheckoutForm` as Scan mode.
- `TillCatalogApi`/`TillCatalogModels`/`TillCatalogRepository`/`TillCatalogViewModel`
  own the browse side; the cart stays in `PosViewModel`. Tap rules and the offline
  grid builder are pure and unit-tested (`CatalogLogicTest`).
- Offline cache: `devices`/`products` gained `categoryId` + `imageUrl` (Room
  migration 4→5, fed by `/sync/changes`) so the grid and pictures work offline.
