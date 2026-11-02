# Customers slice

Customer directory, detail, and purchase history.

## Owns
- Searchable customer list (`GET /customers`) with sort + "has purchases" filter.
- Detail sheet: profile + purchase aggregates + history (`GET /customers/:id/sales`).
- Create (`POST /customers`), gated on `customer.manage`.

## Public API
- `CustomersModule.feature` — the one registry line. Permission: `customer.read`.

## Must never
- Read/write offline: customers have no offline feed; reads show a
  needs-connection note and create is blocked offline.
- Import another feature slice (input helper duplicated locally).

## Notes / deferred
- Edit (`PATCH /customers/:id`) is deferred: the foundation `APIClient` exposes
  only GET/POST, and a slice must not add its own HTTP client. Needs a
  foundation `patch`/`PATCH` method before edit can ship. Create works today.
- The `customers` i18n namespace is not loaded by the foundation `I18n` (its
  namespace list omits it), so labels reuse `sales.*` / `common.*` keys.

## Note
- Named `Customers.README.md` (not `README.md`) to avoid a synchronized-group bundle
  resource basename collision; see the Sales slice note.
