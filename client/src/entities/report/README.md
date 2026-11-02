# entities/report

Read-only financial report data. One query hook per `/reports/*` endpoint.

## Exposes

- Types for every report shape (ProfitReport, TrendPoint, BreakdownRow,
  ExpenseReportRow, ReturnsPage, ConsignmentsReport, InventoryReport,
  ModelPricingRow, DailyClosingReport).
- `reportRepository` — the only place that calls `/reports/*` (via `shared/api`).
- `reportKeys` — the query-key factory; never hand-write key arrays.
- Hooks: `useProfitReport`, `useTrendReport`, `useProfitBreakdown`,
  `useReturnsReport`, `useExpenseReport`, `useConsignmentsReport`,
  `useInventoryReport`, `useModelPricingReport`, `useDailyClosingReport`,
  `useDailyClosingRange`.

## Must never

- Mutate: reports are read-only.
- Format money/dates: the UI does that via `shared/lib/format`.
- Know about the URL, tabs or charts.
