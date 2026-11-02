# features/reports

Financial reports (PRD §6 / wave 6). Class-level perm `report.finance`.

## Owns
- `/reports` route (perm `report.finance`): a 4-tab screen —
  Profit (`/reports/profit`), Expenses (`/reports/expenses`),
  Model Pricing (`/reports/model-pricing`), Daily Closing (`/reports/daily-closing`).
- Each tab renders `fl_chart` bar charts + supporting tables/KPI tiles.
- `data/` — `ReportsRepository` (the 4 report endpoints + a best-effort
  `/device-models` read to label pricing rows) and the slice models.

## Public API
`reports_module.dart` → `reportsRoutes`, `reportsNavItems`.

## Invariants
- All online reads (`FutureProvider.family` keyed by date range / window).
- Cost fields (`avgAcquisitionCost`) are nullable → render "—"; the acquisition
  column shows only with `device.cost.view`.
- Money via `formatMoney`.

## Must never
Touch another slice, `app/`, or `data/local`. No AppBar of its own — it renders
inside the shell Scaffold.
