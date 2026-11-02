# Reports slice

Financial reports matching the web tab set: **Overview · Sales · Expenses ·
Nasiya · Inventory · Pricing · Closing** (`FinTabBar`). A shared date-range bar
(`FinRangeBar`, presets + `KitDateRangeField` for custom) drives the first four;
inventory is a live snapshot, pricing a rolling window, closing a single day.

## Owns
- All `/reports/*` reads (perm `report.finance`) + best-effort `/device-models`
  labels. Charts are **Swift Charts**: `FinTrendChart` (revenue/profit/expense
  lines) and `BarChartCard` breakdowns, with tappable `FinShareList` rows.
- Drill-downs (`FinBreakdownSheet`): NOI waterfall, paginated returns
  (`KitPaginator`), by-model gross-profit/units, and zero-fetch detail for a
  sales-model / partner / inventory-model row.

## Public API
- `ReportsModule.feature` — one line in `FeatureRegistry`. Nav `nav.reports`.

## Permissions
- `report.finance` — the section and every tab/endpoint.
- `device.cost.view` — cost figures (COGS, landed value, acquisition cost).
  The server strips these otherwise, so DTO decoders tolerate their absence.

## Must never
- Import another feature slice (DTOs are duplicated by design). All reads,
  online only; the slice performs no writes.

## Notes / deferred
- Web's cross-entity line-item breakdowns (raw sales lines, device lists,
  partner ledger) need other slices' endpoints → out of scope here; the
  reports-owned drill-downs above stand in.
- Slice-local types are `Fin…`-prefixed (one Swift module).
