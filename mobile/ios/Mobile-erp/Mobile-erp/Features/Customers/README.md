# Customers slice

Customer directory, detail, and purchase history.

## Owns
- Searchable customer list (`GET /customers`) with sort + "has purchases"
  filter, paginated via `KitPaginator` (load more) + CSV export.
- Summary tiles (`GET /customers/stats`): total, new this month, with purchases,
  repeat buyers.
- Detail sheet: profile + purchase aggregates + history (`GET /customers/:id/sales`).
- Create (`POST /customers`), gated on `customer.manage`.

## Public API
- `CustomersModule.feature` — the one registry line. Permission: `customer.read`.

## Must never
- Read/write offline: customers have no offline feed; reads show a
  needs-connection note and create is blocked offline.
- Import another feature slice (input helper duplicated locally).

## Notes
- Create and edit (`POST` / `PATCH /customers/:id`) both run through the shared
  `container.api` (`CustomerFormSheet` switches on `editing`; edit is gated on
  `customer.manage` from the detail sheet). Online-only.
- The `customers` i18n namespace is now loaded by the foundation `I18n`; stat
  tiles use `customers.stat*`. Older list labels still reuse `sales.*`/`common.*`.

## Warm Card (ADR 0022)
- `CustomersView` is a `ScrollView` of `AppCard` rows on the ground, titled by
  `nav.customers`, with the system search bar and filter / new / CSV in the
  toolbar; the summary is a `MetricList`. Detail and the form are kit sheets
  (`SheetTitleRow`, `AppFormField`, shared `FactRow`s, hairline history rows,
  pill buttons); the filter is a kit `FilterSheet`. `CustomersSummary` is gone.
- Labels use the `customers.*` namespace throughout.
- DEBUG screenshot args: `-open customers`, `-openCustomer first`.

## Note
- Named `Customers.README.md` (not `README.md`) to avoid a synchronized-group bundle
  resource basename collision; see the Sales slice note.
