# features/finance — Finance & Dashboard

Ports the web `pages/expenses`, `pages/reports`, `pages/dashboard` slice group.

## Owns
- **Dashboard** (route `dashboard`, auth-only): cross-feature quick actions via
  `container.featureNav` rendered as a One UI shortcut row (rounded-square icon
  tile + label; icons mirror the nav registry per route — POS, inventory, QC,
  sales, consignments, each gated by its permission), KPI period toggle
  (`report.finance`; profit figures tinted by sign via `signTint`), low-stock
  (`device.read`), overdue consignments (`consignment.read`) and model pricing
  (acquisition cost `device.cost.view`). All three section cards are vertical
  row lists mirroring iOS (no horizontal table inside a phone card); pricing
  averages sit one per line so a long Uzbek label never wraps the amount. The
  shared `ModelPricingTable` stays for the wide reports Pricing tab. A role
  with none of the dashboard permissions sees the shared empty state (iOS parity).
- **Date ranges** (`model/FinanceDates.kt`): a range query (dashboard period,
  reports, expenses filter) goes out as UTC instants bounding the *local* days
  (`isoRangeFrom` / `isoRangeTo`, `isoInstant`), the same bounds iOS sends. A
  bare `yyyy-MM-dd` is only for single-date payloads: the server parses it as
  UTC midnight, so `from == to == today` was an empty range and "today" read $0.
- **Reports** (route `reports`, `report.finance`), restructured on the Warm
  Card kit (ADR 0022): six sections on the shared `TabChips` row — P&L overview
  (the sales breakdown folded in as a card with its own group-by and the
  gross-profit ↔ units measure toggle) · Expenses (group-by segmented inside the
  section, period total list-card) · Nasiya · Inventory · Pricing · Closing. The
  period bar (label + `FilterButton` → `ReportFilterSheet`, presets + custom
  range) sits under the chips only on the three period sections. Headline
  figures are `MetricGrid` list-cards whose rows drill down (`ReportDrillSheet`
  on `FactRow`s; the NOI row opens `NoiWaterfallSheet`, returns the paginated
  `ReturnsBreakdownSheet`). Charts are Compose-Canvas on the kit palette only:
  `TrendLineChart` (revenue = text, gross profit = success, expenses = danger;
  three gridlines, zero baseline, first/last bucket labels), `BreakdownBars` /
  `BreakdownRows` (text bar on the border track, danger for a loss, "others"
  muted), `BarChart` (text bars, danger when negative). Pricing ranks the models as
  labelled `BreakdownBars` (no share, price against the dearest), then one card
  per model/storage with keyed facts (`ModelPricingTable` is gone).
- **Expenses** (route `expenses`, `expense.read`): list tab — prominent
  new-expense action with categories/CSV in an overflow menu, summary card, an
  inline search field beside a filter button (active-filter count badge) that
  opens `ExpenseFiltersSheet` (`AppBottomSheet`: category/recurring/sort/min/max/
  date range; min+max share one component for equal height), paginated list +
  load more. No per-screen title (the shell renders it). Recurring-templates tab
  (list, create/edit, activate toggle, generate due). Category create / edit /
  deactivate+reassign (`expense.category.manage`). Expense create / edit / delete
  (`expense.manage`).
  Warm Card (ADR 0022): new-expense is an icon beside the search row (categories
  and CSV in the overflow); the summary is the `MetricGrid` list-card (period
  total + per-category rows, no hero figure); rows are cards with a recurring
  info pill; detail/forms are kit sheets on shared `FactRow`s with `AppSwitch`
  rows (recurring, category active) and one full-width primary save. The
  recurring tab keeps its two actions (new = the one orange, generate = secondary).

## Public API
`FinanceFeature : FeatureModule` — the only export (3 routes).

## Must never
- Edit foundation (`core/ data/ shared/ ui/theme/ app/`) or another slice.
- Queue writes offline — only `sale.create` / `consignment.*` use the outbox;
  expense / category / recurrence writes block with `common.offline`.
- Model cost fields as required — nullable (redacted without `device.cost.view`).

## Notes
- `FinanceApi` is one Retrofit interface built via `container.retrofit.create(...)`.
- Date math is Calendar-based (minSdk 24, no java.time desugaring).
- Chart math (`capWithOther`, `bucketForRange`) is pure + unit-tested
  (`test/.../finance/ReportChartMathTest.kt`).
- Missing i18n key (raw key shows until Gemini adds it): `common.loadMore`
  (introduced by the kit's `LoadMoreFooter`). Every finance/reports/expenses/nav
  key this slice uses already exists in the web JSON.
- Expenses and recurring templates carry an optional `accountCode` (default
  `CASH`); the forms use the shared `AccountPicker` (`shared/payments`) and the
  expense row + detail show the account. `balance.payFrom` labels the picker.
