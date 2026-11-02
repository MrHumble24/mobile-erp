# features/dashboard

Management dashboard (PRD §6 / wave 6). Auth-only route; each data section is
gated by the permission its endpoint needs.

## Owns
- `/dashboard` route (no `PermissionGate` — auth-only). The integrator wires
  `DashboardScreen` as the index `/`, replacing the wave-0 home placeholder.
- Sections: KPI tiles (`/reports/profit`, perm `report.finance`), low-stock
  table (`/stock-alert-rules/low-stock`, perm `device.read`), overdue
  consignments (`/consignments/overdue`, perm `consignment.read`), model-pricing
  table (`/reports/model-pricing`, perm `report.finance`), and quick actions to
  `/pos` (perm `sale.create`) and `/expenses` (perm `expense.read`).

## Public API
`dashboard_module.dart` → `dashboardRoutes`, `dashboardNavItems`.

## Invariants
- A cashier (no finance perms) sees only the quick actions.
- Online reads. `DashProfit` / `DashModelPricingRow` deliberately mirror the
  reports slice — a slice may not import another slice, so each owns its DTO.
  If a third consumer appears, promote these to a shared contract.

## Must never
Touch another slice, `app/`, `data/local`, or the `/` home placeholder.
