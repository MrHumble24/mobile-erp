# reports

Financial read model (PRD Module 5/6). Read-only; computes, never writes.

## Owns

- Nothing. Reports is the legitimate cross-table reader: it queries `sales`,
  `sale_returns`, `devices`, `expenses`, `expense_categories` and
  `consignments` through its own read-only repositories (split per report), so
  no other module exposes its repository.

## Exposes (all `report.finance`)

- `GET /profit?from&to` — revenue, cogs, grossProfit, expenses,
  netOperatingIncome, unitsSold, byChannel {retail,b2b}, returnsRefunded,
  discountsGiven (Σ listPriceSnapshot − salePrice over snapshotted sales, ADR 0034).
- `GET /trend?from&to&bucket=day|week|month` — per-bucket revenue, cogs,
  grossProfit, expenses, unitsSold, returnsRefunded. Empty buckets zero-filled
  in the service (`lib/trend.ts`), range defaults to 30 days.
- `GET /profit/breakdown?from&to&groupBy=channel|model|cashier|day` — per-key
  revenue/cogs/grossProfit/unitsSold + `share` (0–1 of revenue), revenue desc.
- `GET /returns?from&to&page&pageSize` — paginated sale returns with device +
  processor. Drill-down list for the overview sheet.
- `GET /expenses?from&to&groupBy=category|month|day&categoryId?` — rows carry
  `share`. The drill-down list reuses `GET /expenses` (expenses module).
- `GET /consignments?from&to` — created/settled/returned counts, settledRevenue,
  outstandingTotal, overdueCount and byPartner (balances via PartnersService).
- `GET /inventory` — current stock: in-stock units/value, defective, consigned,
  byStatus, byModel (avgDaysInStock), aging buckets 0-30/31-60/61-90/90+.
  No date range.
- `GET /model-pricing?modelId?&windowDays=90` — rolling avg acquisition/landed
  cost + avg selling price per (modelId, specs.storage), unitsInStock/Sold.
  JSONB grouping → parameterised `$queryRaw` (Prisma.sql), repository only.
- `GET /daily-closing?date=` — one-day digest for the Telegram job.
- `GET /daily-closing/range?from&to` — one zero-filled row per day for a table.

## Services

`ReportsService` owns profit/expenses/model-pricing/daily-closing(+range);
`ReportsAnalyticsService` owns trend/breakdown/returns/consignments/inventory and
injects `PartnersService` for consignment balances. Share/zero-fill/aging math is
in `lib/` (pure, unit-tested in `reports-math.spec.ts`).

## Redaction gate

`report.finance` gates access to the endpoints, but cost/profit figures carry a
second gate: the global `CostRedactionInterceptor` strips cost aliases (`cogs`,
`inStockLandedValue`, `landedValue`, `avgAcquisitionCost`, `avgLandedCost`) unless
the caller holds `device.cost.view`, and profit aliases (`grossProfit`,
`netOperatingIncome`, `netProfit`) unless they hold `sale.profit.view` (ADR 0019).
Revenue-only figures (`revenue`, `settledRevenue`, `avgSellingPrice`) are not
redacted. Any new cost/profit-derived report field must be added to the key lists
in `common/lib/redact.ts`.

## Quantity sales (ADR 0030)

A quantity sale has no device; its model is on the sale (`sale.modelId`) and it
carries `quantity`. Totals that aggregate `sales`/`sale_returns` directly
(profit, trend, daily-closing, sale stats) already include quantity sales. The
queries that reached a product **through the device** were fixed to use the
effective model: profit **breakdown by model** (`LEFT JOIN devices`, group on
`coalesce(d.modelId, s.modelId)`) and the **returns** list (model from the sale
when the device is null; the row shows `quantity`). The **inventory** report's
stock value folds in quantity-stock value (`StockService.totalStockValue`);
unit counts stay phone-centric. Model-pricing is deliberately phone-only
(per-storage rolling averages have no meaning for accessories).

## Must never

- Load whole tables into JS or run per-row queries; each endpoint is aggregates.

Expense reads (profit, trend, daily closing, expenses report) exclude soft-deleted rows (`deletedAt IS NULL`, ADR 0017); any new expense query here must do the same.
