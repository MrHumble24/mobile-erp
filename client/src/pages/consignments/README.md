# pages/consignments

Route `/consignments` (needs `consignment.read`). Nasiya device transfers:
filterable, paginated list with summary tiles, detail sheet, settle/return
and CSV export (PRD Module 4).

## Layout

- `ConsignmentsPage` — thin: header + Export CSV + new-consignment
  (`consignment.create`), owns dialog/sheet state, runs
  `useConsignments(queryFilters)`.
- `model/use-consignment-filters.ts` — URL-backed filters (search debounced,
  status incl. `overdue`, date range, partnerId) + pagination; derives the
  server `ConsignmentFilters`.
- `ConsignmentsFilters` — search / status / period row.
- `ConsignmentsSummary` — tiles from `useConsignmentStats`.
- `ConsignmentsTable` — partner, IMEI, agreed price, due date + days overdue,
  status badge, row actions (detail / settle / return).
- `ConsignmentDetailSheet` — partner link, terms, device via `DeviceDrawer`,
  resulting-sale link when SETTLED, settle/return.
- `lib/overdue.ts` (days past due) · `lib/consignments-csv.ts` (page export).

## Never

Import another page. Call `useQuery` here. Render native form/table controls.
Author Uzbek copy.
