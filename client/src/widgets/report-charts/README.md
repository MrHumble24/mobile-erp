# widgets/report-charts

Reusable recharts blocks for the reports and dashboard pages, built on
`shared/ui/chart` (shadcn + recharts).

## Exposes

- `TrendChart` — 3-series area (revenue, gross profit, expenses), one y-axis.
  Internals: `ui/EChartsTrend.tsx` (the ECharts canvas), `ui/TrendTable.tsx`
  (the table toggle view), `lib/build-trend-option.ts` (pure ECharts option builder).
- `BreakdownBarChart` — single-measure horizontal bars, top-N + "Other",
  optional per-bar sequential colors, click-to-drill via `onSelect`.
- `ChartCard` — Card shell with chart/table toggle, CSV export, and
  loading/empty/error states. Every chart lives inside one.
- `ShareTable` — the chart's rows rendered as a `Table` (accessibility/copy).
- `palette` — fixed categorical `SERIES_VARS`, `SEQUENTIAL_VARS`, `capWithOther`.

## Chart rules (enforced here)

- One y-axis per chart; fixed role-ordered colors (`--chart-1..8`), never
  cycled; a 9th category folds into "Other". Aging uses a single-hue ramp.
- Every chart has a tooltip (value + share), a table toggle and a CSV export
  (UTF-8 BOM, `;` separator).

## Must never

- Fetch data (take rows as props) or know about routing.
