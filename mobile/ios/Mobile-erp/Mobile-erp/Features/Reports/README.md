# Reports slice

Financial reports restructured for the phone on the Warm Card kit (ADR 0022):
six sections on the shared `TabChips` row — **P&L overview · Expenses · Nasiya
· Inventory · Pricing · Closing**. The sales breakdown lives inside the overview
as a card with its own group-by (`FinSalesBreakdownCard`). The period bar
(label + filter button → kit `FilterSheet` with presets and two `AppDateField`s
for custom) sits under the chips on the three period sections; inventory is a
live snapshot, pricing a rolling window, closing a single day. Title is
`nav.reports`, the same string as Android.

## Owns
- All `/reports/*` reads (perm `report.finance`) + best-effort `/device-models`
  labels. Headline figures are `MetricList` rows (`MetricRow.onTap` drills
  down). Charts stay on the kit palette: `FinTrendChart` (one series at a time
  behind the kit `SegmentedControl`; revenue = text, profit = success/danger,
  expenses = danger; Swift Charts bars on a temporal axis), `FinBreakdownBars` /
  `FinBreakdownRows` (text bar on the border track, danger for a loss) and
  `BarChartCard` (text bars) for the closing-day and average-price comparisons.
- Drill-downs (`FinBreakdownSheet`, a kit sheet on `FactRow`s): NOI rows,
  paginated returns (`KitPaginator`), by-model gross-profit/units ranking, and
  zero-fetch facts for a sales-model / partner / inventory-model row.
- Pricing ranks the models as labelled `FinBreakdownBars` (`showsShare: false`,
  price against the dearest), then one card per model/storage with keyed facts
  (margin only with `device.cost.view`). Unlabelled vertical bars read as nothing.

## Public API
- `ReportsModule.feature` — one line in `FeatureRegistry`. Nav `nav.reports`.

## Permissions
- `report.finance` — the section and every tab/endpoint.
- `device.cost.view` — cost figures (COGS, landed value, acquisition cost).
  The server strips these otherwise, so DTO decoders tolerate their absence.

## Must never
- Import another feature slice (DTOs are duplicated by design). All reads,
  online only; the slice performs no writes.
- Colour a chart with the action orange or an arbitrary hue — text on the
  border track, success/danger for signed money only.

## Notes / deferred
- Web's cross-entity line-item breakdowns (raw sales lines, device lists,
  partner ledger) need other slices' endpoints → out of scope here.
- Slice-local types are `Fin…`-prefixed (one Swift module).
- DEBUG screenshot args: `-open reports`, `-openTab overview|expenses|nasiya|inventory|pricing|closing`.
