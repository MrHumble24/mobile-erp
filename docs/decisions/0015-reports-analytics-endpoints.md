# 0015 — Reports analytics & drill-down endpoints

Date: 2026-11-02
Status: Accepted

## Context

The `/reports` screen grew from four tables into an analytics dashboard with
trend charts and clickable drill-downs. This adds endpoints on top of the ADR
0009 read model without changing its ground rules.

## Decision

- New routes, all still behind `report.finance` on the one controller:
  `GET /trend`, `/profit/breakdown`, `/returns`, `/consignments`, `/inventory`,
  `/daily-closing/range`; `/expenses` gains `groupBy=day`, `categoryId` and a
  per-row `share`.
- Each endpoint stays a bounded set of aggregate queries (JSONB/multi-table via
  parameterised `Prisma.sql`). The only JS over rows is post-aggregate assembly
  (share, zero-fill, aging), kept pure in `lib/` and unit-tested.
- **Zero-fill** is in the service, not SQL, so it is testable: repositories
  return only buckets with activity; `lib/trend.ts` fills the rest with zeros
  and derives `grossProfit = revenue − cogs`. Trend/range default to 30 days.
- **Aging buckets** are the fixed set `0-30 | 31-60 | 61-90 | 90+`, bucketed in
  SQL (interval CASE) and ordered/zero-filled in `lib/aging.ts`.
- Service split: `ReportsService` (profit/expenses/pricing/closing) and
  `ReportsAnalyticsService` (trend/breakdown/returns/consignments/inventory,
  injecting `PartnersService` for balances) — one reason to change each, both
  under the file-size limit.
- Cost/profit field names (cogs, grossProfit, landedValue, settledRevenue, …)
  stay gated only by `report.finance`; they are never added to the
  `CostRedactionInterceptor` lists.

## Consequences

- Adding a breakdown dimension = a SQL branch + a pure assembler, no schema
  change and no new permission.
- Drill-down lists reuse owning modules' list endpoints (sales, expenses,
  consignments, devices); reports does not duplicate them.
