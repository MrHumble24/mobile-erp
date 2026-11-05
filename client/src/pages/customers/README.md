# pages/customers

The `/customers` management screen (PRD Module 3). Thin page that composes
filters, summary tiles, a table, pagination, the detail sheet, and the
`manage-customer` create/edit dialog.

## Owns

- `model/use-customer-filters.ts` — URL-backed filters (search debounced in local
  state, `has`, `sort`, pagination). Single source of filters for the page.
- `lib/customers-csv.ts` — exports the current page via `shared/lib/csv`.
- `ui/` — page shell, filter row, metric tiles, table + row, detail sheet,
  purchase-history list, warranty badge. The row + detail show the credit
  position (left to pay, overdue, limit in use) and the detail lists the
  customer's credits (`CustomerCreditsList`), all from `entities/credit` (ADR 0035).
  When `repairsEnabled` and the caller has `repair.read`, the detail also lists
  the customer's repair tickets (`CustomerRepairsList`, `entities/repair`, ADR 0040).

## Data

- `entities/customer` hooks only (`useCustomerList`, `useCustomerStats`,
  `useCustomer`, `useCustomerSales`). Writes go through `features/manage-customer`.
- Purchase history reuses `entities/sale`'s `warrantyRemainingDays` and the
  `widgets/device-drawer` to open a device by IMEI; receipt links point at
  `/sales/:id/receipt`.

## Must never

- Call HTTP or `useQuery`/`useMutation` directly; hold server data in state.
