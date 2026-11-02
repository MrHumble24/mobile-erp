# features/report-breakdown

The drill-down Sheet that explains where a report number comes from. Opened by
the reports page from a hero tile or a chart bar.

## Exposes

- `ReportBreakdownSheet` — controlled Sheet; renders the component the request's
  `kind` maps to in `model/registry.ts`.
- `BreakdownRequest` / `BreakdownKind` — the discriminated request union.

## Add a breakdown

Add a variant to `BreakdownRequest`, a component under `ui/`, and one entry in
`BREAKDOWN_REGISTRY`. No switch chains.

## Kinds

revenue / cogs / salesByModel → sales-line table; grossProfit / units → model
magnitude bars; expenses / expenseCategory → expense list; returns → refunds
list; noi → clickable revenue − cogs − expenses formula; partner →
consignments + ledger; inventoryModel → in-stock devices.

## Must never

- Import a widget or another feature (FSD). It uses entities' hooks + `shared/ui`
  only. Charts here are inline divs/`shared/ui/chart`, not `widgets/report-charts`.
- Read the URL. The page supplies `onNavigate`, `onBreakdown` and `canViewCost`.
