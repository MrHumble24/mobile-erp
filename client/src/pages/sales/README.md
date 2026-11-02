# pages/sales

Route `/sales` (needs `sale.read`). Sales management screen: filterable,
paginated sale list with summary tiles, a detail sheet, receipts, returns and
warranty lookup. Also owns `/sales/:id/receipt` (print page).

## Layout

Two tabs (`Sales` | `Warranty lookup`), ClickUp style like `pages/qc` /
`pages/shipments`.

- `SalesPage` — thin: header + Export CSV, tabs, owns dialog state (detail /
  receipt / return) and runs `useSales`.
- `model/use-sales-filters.ts` — URL-backed filters + pagination (the single
  source of filter state); derives the server `SaleFilters`, debounces search.
- `SalesListTab` → `SalesFilters` (+ `CashierFilter`, admins only),
  `SalesSummary` (stats tiles), `SalesTable` → `SalesTableRow`.
- `SaleDetailSheet` fetches by id (works from a table row and from warranty
  lookup) → `SaleDetailSections`, opens `DeviceDrawer` by IMEI.
- `SaleWarrantyBadge` — shared warranty state cell (table + sheet).
- `lib/sales-csv.ts` — current-page export; cost columns only with profit view.

## Invariants

- Profit column/tile and landed cost render only with `sale.profit.view`
  (server also redacts the fields).
- Return flow reuses `features/warranty-lookup`'s `ReturnSaleDialog`; the page
  composes it (features never import each other).
- Date presets come from `shared/lib/date-range`; no business logic in presets.

## Never

Import another page. Call `useQuery` here (entity hooks only). Render native
form/table controls (use `shared/ui`).
