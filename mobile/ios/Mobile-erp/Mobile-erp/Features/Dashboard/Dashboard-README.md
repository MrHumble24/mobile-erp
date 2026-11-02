# Dashboard slice

Management dashboard: KPI tiles (today/week/month), low-stock alerts, overdue
consignments and model pricing. Auth-only; each card is gated by its own
endpoint's permission, so a cashier sees nothing finance-related.

## Owns
- `/reports/profit`, `/reports/model-pricing`, `/stock-alert-rules/low-stock`,
  `/consignments/overdue`, `/device-models` reads. All online.

## Public API
- `DashboardModule.feature` — register with one line in `FeatureRegistry`.
  Feature id `dashboard`; the integrator makes it the shell start destination.

## Permissions (per card)
- `report.finance` — KPIs + model pricing. `device.read` — low stock.
  `consignment.read` — overdue. `device.cost.view` — acquisition-cost figure.

## Must never
- Import another feature slice (DTOs/tiles duplicated by design).
- Edit the shell / home / foundation.

## Notes
- Quick actions (jump to POS / Expenses) are deferred: cross-tab navigation is a
  shell concern with no feature-facing API yet. Integrator wiring needed.
