# pages/reports

The reports & analytics screen. Composes `widgets/report-charts`,
`features/report-breakdown` and `entities/report` hooks.

## Tabs (URL `?tab=`)

overview (P&L hero tiles + trend + channel), sales, expenses, nasiya,
inventory, pricing, closing. Each tab is one file in `ui/`.

## Shared filter

`useReportRange` (model/) stores a date preset (today / 7d / 30d / this month /
last month / custom) in URL search params so links are shareable, and derives
the trend bucket (day ≤31d, week ≤180d, else month). The inventory and pricing
tabs ignore the range (current stock / rolling window).

## Drill-down

The page owns `breakdown` state; tiles and chart bars call `onBreakdown(req)`,
which opens `ReportBreakdownSheet`. `canViewCost` (device.cost.view) and
`navigate` are read here and passed down — entities/features never touch the URL.

## Must never

- Call `useQuery`/HTTP directly, or format money outside `shared/lib/format`
  (`formatMoney` = UZS so'm).
