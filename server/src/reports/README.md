# reports

Financial read model (PRD Module 5/6). Read-only; computes, never writes.

## Owns

- Nothing. Reports is the legitimate cross-table reader: it queries `sales`,
  `sale_returns`, `devices`, `expenses`, `expense_categories` and
  `consignments` through its own read-only repositories (split per report), so
  no other module exposes its repository.

## Exposes (all `report.finance`)

- `GET /profit?from&to` — revenue, cogs, grossProfit, expenses,
  netOperatingIncome, unitsSold, byChannel {retail,b2b}, returnsRefunded.
- `GET /expenses?from&to&groupBy=category|month`.
- `GET /model-pricing?modelId?&windowDays=90` — rolling avg acquisition/landed
  cost + avg selling price per (modelId, specs.storage), unitsInStock/Sold.
  JSONB grouping → parameterised `$queryRaw` (Prisma.sql), repository only.
- `GET /daily-closing?date=` — digest for the wave-3 Telegram job.

## Redaction gate

`report.finance` IS the gate for cost/profit names here (cogs, grossProfit,
netOperatingIncome, avgAcquisitionCost, avgLandedCost). They are deliberately
NOT added to the `CostRedactionInterceptor` key lists — the permission guards
the whole controller.

## Must never

- Load whole tables into JS or run per-row queries; each endpoint is aggregates.
