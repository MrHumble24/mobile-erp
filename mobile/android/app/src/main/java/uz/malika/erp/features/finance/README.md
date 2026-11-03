# features/finance — Finance & Dashboard

Ports the web `pages/expenses`, `pages/reports`, `pages/dashboard` slice group.

## Owns
- **Dashboard** (route `dashboard`, auth-only): cross-feature quick actions via
  `container.featureNav` rendered as a One UI shortcut row (rounded-square icon
  tile + label; icons mirror the nav registry per route — POS, inventory, QC,
  sales, consignments, each gated by its permission), KPI period toggle
  (`report.finance`; net income tinted via `signedEmphasis`), low-stock
  (`device.read`), overdue consignments (`consignment.read`), model pricing as a
  two-line row list mirroring iOS so it fits the card with no clipped header
  (acquisition cost `device.cost.view`). The shared `ModelPricingTable` stays for
  the wide reports Pricing tab.
- **Reports** (route `reports`, `report.finance`): seven tabs matching web —
  Overview / Sales / Expenses / Nasiya / Inventory / Pricing / Closing. The tab
  pills stay inline (navigation); all filters live in one `ReportFilterSheet`
  opened from a top-right `FilterButton`, with the active range shown as a
  compact label beside it. The sheet holds the date-range presets (today / 7d /
  30d / month / custom) and, on Sales/Expenses, that tab's group-by selector
  (hoisted into the screen). Shown only on the ranged tabs. Charts are
  Compose-Canvas (no lib):
  `TrendLineChart` (multi-series) + `BreakdownBars` (ranked horizontal bars with
  share, top-N capped) + `NoiWaterfall` (Canvas NOI waterfall). Tapping a tile or
  bar opens a breakdown drill-down: the data-driven `ReportDrillSheet` (model/
  partner rows jump via `featureNav`); the Overview NOI tile opens
  `NoiWaterfallSheet`; the returns tile opens the paginated `ReturnsBreakdownSheet`
  (`/reports/returns`, load-more); the Sales "model" group shows
  `ModelMeasureTable` (segmented gross-profit ↔ units toggle, ranked by measure).
- **Expenses** (route `expenses`, `expense.read`): list tab — prominent
  new-expense action with categories/CSV in an overflow menu, summary card, an
  inline search field beside a filter button (active-filter count badge) that
  opens `ExpenseFiltersSheet` (`AppBottomSheet`: category/recurring/sort/min/max/
  date range; min+max share one component for equal height), paginated list +
  load more. No per-screen title (the shell renders it). Recurring-templates tab
  (list, create/edit, activate toggle, generate due). Category create / edit /
  deactivate+reassign (`expense.category.manage`). Expense create / edit / delete
  (`expense.manage`).

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
