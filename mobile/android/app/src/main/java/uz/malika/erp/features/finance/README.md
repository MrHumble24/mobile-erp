# features/finance — Finance & Dashboard

Ports the web `pages/expenses`, `pages/reports`, `pages/dashboard` slice group.

## Owns
- **Dashboard** (route `dashboard`, auth-only): cross-feature quick actions via
  `container.featureNav` (POS, inventory, QC, sales, consignments — each gated by
  its permission), KPI period toggle (`report.finance`), low-stock (`device.read`),
  overdue consignments (`consignment.read`), model pricing (cost col `device.cost.view`).
- **Reports** (route `reports`, `report.finance`): seven tabs matching web —
  Overview / Sales / Expenses / Nasiya / Inventory / Pricing / Closing. A shared
  `AppDateRangeField` drives the ranged tabs. Charts are Compose-Canvas (no lib):
  `TrendLineChart` (multi-series) + `BreakdownBars` (ranked horizontal bars with
  share, top-N capped). Tapping a tile or bar opens `ReportDrillSheet` (a
  data-driven breakdown drill-down; model/partner rows jump via `featureNav`).
- **Expenses** (route `expenses`, `expense.read`): list tab (summary, filters —
  search/category/recurring/amount/sort/date range, paginated list + load more,
  CSV export) and recurring-templates tab (list, create/edit, activate toggle,
  generate due). Category create / edit / deactivate+reassign (`expense.category.manage`).
  Expense create / edit / delete (`expense.manage`).

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
