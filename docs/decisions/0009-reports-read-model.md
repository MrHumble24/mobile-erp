# 0009 — Reports read model

Date: 2026-11-01
Status: Accepted

## Context

Financial reports (profit, expenses, rolling model pricing, daily closing) read
across `sales`, `sale_returns`, `devices`, `expenses`, `expense_categories` and
`consignments`. Our module rule says a module injects another module's *service*,
never its repository — but a reporting layer that goes service-to-service would
force every owning module to expose aggregate methods it does not otherwise need,
and would still not solve JSONB (`specs->>'storage'`) grouping.

## Decision

Reports is the one legitimate cross-table reader. It owns read-only repositories
(split per report to stay under the file-size limit) that query other modules'
tables directly via Prisma. Every endpoint is a bounded set of aggregates — no
per-row queries, no loading whole tables into JS. JSONB grouping uses a
parameterised `$queryRaw` (`Prisma.sql`), confined to the repository.

The cost/profit field names in report responses (cogs, grossProfit,
netOperatingIncome, avgAcquisitionCost, avgLandedCost) are gated solely by the
`report.finance` permission on the controller; they are intentionally NOT added
to the `CostRedactionInterceptor` key lists. The permission is the gate.

The model-pricing rolling window defaults to 90 days, configurable via
`windowDays`.

## Consequences

- No owning module leaks its repository; reports stays the only exception.
- Adding a report = add a repository + a service method, not a schema change.
- A new redacted-looking field in a report needs no interceptor change, but any
  report route must keep `report.finance`.
