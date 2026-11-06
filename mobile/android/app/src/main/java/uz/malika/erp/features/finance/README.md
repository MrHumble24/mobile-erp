# features/finance — Finance & Dashboard

Ports the web `pages/expenses`, `pages/reports`, `pages/dashboard`.
`FinanceFeature : FeatureModule` (routes `dashboard`, `reports`, `expenses`).

## Owns
- **Dashboard** (`dashboard`): feature quick actions, KPI period toggle
  (`report.finance`), low stock, overdue consignments, model pricing
  (costs only with `device.cost.view`).
- **Reports** (`reports`, `report.finance`): P&L overview, expenses, Nasiya,
  inventory, pricing, closing, customs fees. Period bar + filter sheet
  (`ReportFilterSheet`); headline figures drill into `ReportDrillSheet`.
- **Expenses** (`expenses`, `expense.read`): list/search, summary card,
  recurring templates, categories (create/edit/deactivate+reassign).
- **Date ranges** (`model/FinanceDates.kt`): bounded as UTC instants around
  local days (`isoRangeFrom`/`isoRangeTo`/`isoInstant`).

## Step 11 (ADR 0043/0060)
- The P&L overview shows `reports.pointsEarned` and `reports.pointsSpent`
  (plain numbers, not money) only when at least one is non-zero
  (`ProfitReport.bonusPointsEarned/Spent`).

## Must never
- Edit foundation or another slice; queue writes offline (only `sale.create`
  / `consignment.*` use the outbox); model cost fields as required
  (nullable when redacted).
