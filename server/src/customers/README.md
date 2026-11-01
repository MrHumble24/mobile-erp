# customers

B2C customer directory (PRD Module 3). Owns the `customers` table.

## HTTP

- `GET /customers?q=` (`customer.read`) → `CustomerView[]` — substring match on name/phone.
- `GET /customers/:id` (`customer.read`) → `CustomerView` (404 if missing).
- `GET /customers/:id/sales` (`customer.read`) → `SaleView[]` — this customer's sales,
  newest first (delegates to `SalesService`; cost/profit fields redacted per permission).
- `POST /customers` (`customer.manage`) `{ name, phone?, notes? }` → `CustomerView`.
- `PATCH /customers/:id` (`customer.manage`) `{ name?, phone?, notes? }` → `CustomerView`.

`CustomerView` = `{ id, name, phone, notes, createdAt }`.

## Decisions

- `/:id/sales` lives here (it is the customer sub-resource) and imports
  `SalesModule` for its service. `SalesModule` never imports this module, so
  there is no cycle. Inline customer creation during checkout is done inside the
  sales transaction, not here.

## Must never

- Hold sale/warranty logic — that is `sales`.
- Reach into another module's repository.
