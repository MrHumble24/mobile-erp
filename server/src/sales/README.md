# sales

Retail checkout, warranty, returns, receipts (PRD Module 3). Owns `sales`,
`warranties`, `sale_returns`.

## HTTP

- `POST /sales` (`sale.create`) `{ imei, salePrice, customerId?, customer?{name,phone},
  warrantyDays?, notes?, clientMutationId?, expectedVersion? }` → `SaleView`.
  Device must exist (404) and be IN_STOCK (409 otherwise — DEFECTIVE is not
  sellable, see ADR 0007). Idempotent on `clientMutationId` (returns the prior sale).
- `GET /sales` (`sale.read`) `?from&to&soldById&customerId&channel=retail|b2b&page&pageSize`
  → `{ items: SaleView[], total, page, pageSize }`. Channel: retail = `consignmentId`
  null, b2b = not null.
- `GET /sales/:id` (`sale.read`) → `SaleView`.
- `GET /sales/warranty/:imei` (`sale.read`) → `WarrantyLookupView`
  `{ imei, saleId, purchasedAt, salePrice, warranty{days,startsAt,endsAt}|null,
  remainingDays, latestInspection{grade,notes}|null, alreadyReturned }`.
- `POST /sales/:id/return` (`sale.return`) `{ refundAmount, reason?,
  deviceToStatusCode:'IN_STOCK'|'DEFECTIVE', expectedVersion? }` → `SaleView` (409 if already returned).
- `GET /sales/:id/receipt` (`sale.read`) → `ReceiptView` (no cost fields at all).

`SaleView` = `{ id, device{imei,model{brand,name},specs}, customer, salePrice,
landedCostSnapshot, netProfit, soldAt, soldBy{id,name}, warranty, consignmentId }`.
`netProfit` is derived in the mapper (salePrice − landedCostSnapshot), never stored;
`CostRedactionInterceptor` strips `landedCostSnapshot`/`netProfit` per permission.

## Cross-module writes (to be routed through DevicesService.changeStatus after wave 2 merge)

`sales-checkout.repository.ts` writes these inside the sale/return `$transaction`
for atomicity (inventory module does not exist in this worktree):
- `devices`: `statusCode` IN_STOCK→SOLD (checkout) / SOLD→chosen (return), `version += 1`,
  guarded by `where {id, version: expectedVersion[, statusCode]}` (409 on mismatch).
- `device_status_history`: one row `{fromStatusCode, toStatusCode, changedById, reason}`
  (reason `sale` / `warranty return`).
- `customers`: inline customer upsert-by-phone / create during checkout.
Also reads `store_settings` (id=1) for `defaultWarrantyDays` and `qc_inspections`.

## Must never

Store `netProfit`/`channel`; put cost fields in the receipt; inject another module's repo.
