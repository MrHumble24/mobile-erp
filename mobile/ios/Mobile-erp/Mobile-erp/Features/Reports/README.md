# Reports slice

Financial reports on the Warm Card kit (ADR 0022): six sections on `TabChips` —
**P&L overview · Expenses · Nasiya · Inventory · Pricing · Closing**. Title is `nav.reports`.

## Owns
- `/reports/*` reads (`report.finance`) + model labels.
- Headline figures in `MetricList` with drill-downs (`FinBreakdownSheet`).
- P&L overview displays `reports.pointsEarned` and `reports.pointsSpent` as plain numbers when non-zero.
- Period bar with presets and custom date range.

## Public API
- `ReportsModule.feature` — registered in `FeatureRegistry`.

## Permissions
- `report.finance` — reports tabs and endpoints.
- `device.cost.view` — cost figures (COGS, landed value).

## Must never
- Import another feature slice directly.
- Write data (slice is read-only).

## Notes
- Slice-local types use `Fin…` prefix.
- `ProfitReport` decodes `bonusPointsEarned` and `bonusPointsSpent` from `/reports/profit`.
