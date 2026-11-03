# features/nasiya — Partners & Consignment (Android)

The "Partners & Consignment" slice group ported from the web client. One slice
because the consign-device flow is shared by both screens and both read the
same partner mirror — so there is no cross-slice import to duplicate.

## Owns
- **Partners** (`partner.read`): directory with search + `active`/`overdue`
  facets — online from `/partners` (the mirror can't serve those facets), falling
  back to the LOCAL mirror (search only) offline; ledger + aging + record-payment
  (one-tap "fill full balance") + create/edit (online); consign from a partner's
  ledger.
- **Consignments** (`consignment.read`): Out/Overdue/Settled/Returned/All tabs,
  search, date range, summary tiles, CSV export, "load more" pagination; detail
  sheet (links to device + resulting sale via cross-feature nav); consign (native
  Caldera date picker for the due date) / settle / return.

## Public API
- `NasiyaFeature` — the `FeatureModule` (two nav items). Integrator adds it to
  `app/FeatureRegistry.kt`. Nothing else is exported.

## Offline model (ADR 0008)
- `consignment.create|settle|return` go through `ConsignmentWriter`: REST when
  online, else the outbox; a network error mid-call also falls back to the
  outbox. A pending marker counts queued consignment mutations.
- Partner create/edit/payment are **online-only** — they block with a
  needs-connection message; never fake-queued.

## Must never
- Edit foundation/shell/registry or another slice's files.
- Put server-owned lists in client state, or call HTTP outside `data/`.
- Hand-write Uzbek — i18n comes from the web JSON via `t()`.

## Notes / limits
- `data/NasiyaApi.kt` is a Retrofit interface for routes not on `ApiService`,
  built via `container.retrofit.create(...)` (the one shared client).
- The mirror lacks isActive/overdueCount, so the `active`/`overdue` facets come
  from the online `/partners` list (disabled offline); edit fetches the full
  partner first to avoid blanking fields on PATCH.
- Every consignments tab (overdue included) rides the one paginated
  `/consignments` endpoint, so one path drives date range + "load more".
- Cross-feature nav: the detail sheet opens `Destination.Inventory(imei)` /
  `Destination.Sales(saleId)`; the screen consumes `Destination.Consignments(id)`
  via `featureNav.consumeArg`, fetching that row by id.
- Reuses kit `AppDateRangeField`/`MetricTile`; `CreditBar`, `PartnerPicker`,
  `DueDatePicker` (single M3 date) stay slice-local.
