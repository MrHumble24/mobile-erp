# Reports slice

Financial reports: Profit / Expenses / Model pricing / Daily closing, switched
from the navigation-title menu. Each tab fetches on its own.

## Owns
- `/reports/*` reads (perm `report.finance`) + best-effort `/device-models`
  labels. Breakdown charts drawn with **Swift Charts** (`BarChartCard`).

## Public API
- `ReportsModule.feature` — register with one line in `FeatureRegistry`.
  Nav `nav.reports`, permission `report.finance`.

## Permissions
- `report.finance` — see the section and all tabs.
- `device.cost.view` — the acquisition-cost figure in model pricing (hidden
  and modelled optional otherwise — the server redacts it).

## Must never
- Import another feature slice (DTOs are duplicated by design).
- Edit foundation. Write data — all reads, online only.

## Notes
- Scope matches the ported Flutter spec (profit/expenses/pricing/closing);
  breakdowns are the in-tab charts, not the web's drill-down sheets.
