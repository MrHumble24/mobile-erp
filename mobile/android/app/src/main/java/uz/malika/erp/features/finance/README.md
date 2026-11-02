# features/finance — Finance & Dashboard

Ports the web `pages/expenses`, `pages/reports`, `pages/dashboard` slice group.

## Owns
- **Dashboard** (route `dashboard`, auth-only): quick actions, KPI period toggle
  (`report.finance`), low-stock (`device.read`), overdue consignments
  (`consignment.read`), model pricing (`report.finance`; cost col `device.cost.view`).
- **Expenses** (route `expenses`, `expense.read`): summary, category + recurring
  filters, list + detail sheet, log-expense and delete (`expense.manage`),
  manage categories (`expense.category.manage`). Writes are **online-only**.
- **Reports** (route `reports`, `report.finance`): Profit, Expenses, Model
  pricing, Daily closing tabs — KPI tiles + Compose-Canvas bar charts.

## Public API
`FinanceFeature : FeatureModule` — the only export. Integrator adds
`FinanceFeature,` to `FeatureRegistry.features` and makes `dashboard` the start route.

## Must never
- Edit foundation (`core/ data/ shared/ ui/theme/ app/`) or another slice; it
  duplicates no cross-slice state (reports + dashboard share DTOs in-slice only).
- Queue writes offline — only `sale.create` / `consignment.*` use the outbox.
  Expense/category writes block with `common.offline` when offline.
- Model cost fields as required — they are nullable (redacted without
  `device.cost.view`) and the cost column/row hides.

## Notes
- `data/FinanceApi` is a Retrofit interface built via
  `container.retrofit.create(...)` (the one shared client). Dashboard/reports
  tiles use the promoted `shared/ui/MetricTile`.
- Date math is Calendar-based (minSdk 24, no java.time desugaring).
- Deferred vs. web: Overview/Sales/Inventory/Nasiya report tabs, breakdown
  drill-down sheets (ADR 0009/0015), trend/share charts, recurring-expense
  templates, CSV export — a later wave (matches the Flutter porting spec scope).
