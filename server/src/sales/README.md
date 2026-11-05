# sales

Retail checkout, warranty, returns, receipts (PRD Module 3). Owns `sales`,
`warranties`, `sale_returns`.

## HTTP

- `POST /sales` (`sale.create`) `{ imei?, serialNumber?, salePrice,
  payments?[{accountCode,amount}], customerId?, customer?{name,phone},
  warrantyDays?, notes?, clientMutationId?, expectedVersion? }` → `SaleView`.
  Send **exactly one** of `imei`/`serialNumber` (400 otherwise); it is resolved
  against imei, imei2 or serialNumber (ADR 0029, `unitCodeWhere`). The device
  must exist (404) and be IN_STOCK (409 otherwise — DEFECTIVE is not
  sellable, see ADR 0007). Idempotent on `clientMutationId` (returns the prior
  sale, posts the ledger rows once). `payments` omitted = one CASH line for the
  whole price; present = amounts positive, accounts distinct and active, summing
  to `salePrice` exactly (400 otherwise). One `SALE` ledger row posts per line
  inside the checkout transaction (ADR 0025).
- `GET /sales` (`sale.read`)
  `?from&to&soldById&customerId&channel=retail|b2b&search&returned=true|false&warranty=active|expired&page&pageSize`
  → `{ items: SaleView[], total, page, pageSize }`. Channel: retail = `consignmentId`
  null, b2b = not null. `search` matches either device IMEI column (contains) or
  customer name/phone (contains, insensitive). `warranty=active` excludes returned
  units. The WHERE clause
  is `lib/sale-where.ts` (one source of truth for list + stats).
- `GET /sales/stats` (`sale.read`) — same filters as the list (page/pageSize ignored) →
  `{ count, revenue, avgPrice, returnedCount, refundTotal, netProfit }`. Aggregates the
  filtered set; `netProfit` = Σ salePrice − Σ landedCostSnapshot (auto-redacted by
  `CostRedactionInterceptor`). Lives here, not in `reports`, so a cashier can see their
  own day summary without `report.finance`. Declared before `:id`.
- `GET /sales/:id` (`sale.read`) → `SaleView`.
- `GET /sales/warranty/:imei` (`sale.read`; the `:imei` path segment is any unit
  code — matches imei, imei2 or serialNumber) → `WarrantyLookupView`
  `{ imei, serialNumber, saleId, purchasedAt, salePrice,
  warranty{days,startsAt,endsAt}|null, remainingDays,
  latestInspection{grade,notes}|null, alreadyReturned }`.
- `POST /sales/:id/return` (`sale.return`) `{ refundAmount, reason?,
  deviceToStatusCode:'IN_STOCK'|'DEFECTIVE', expectedVersion? }` → `SaleView`
  (409 if already returned). The refund is capped at the sale's net `SALE` total
  (or `salePrice` for a pre-ledger sale) — 400 above it (ADR 0028). `REFUND` rows
  (money out) post in proportion to the sale's `SALE` rows (remainder on the
  largest part); a sale with no ledger rows refunds from CASH. ADR 0025.
- `GET /sales/:id/receipt` (`sale.read`) → `ReceiptView` (no cost fields). Carries
  `payments: [{ accountCode, amount }]` (the SALE rows; `[]` when none) so a
  printed receipt can show the cash and card parts.

`SaleView` = `{ id, device{imei,imei2,serialNumber,model{brand,name,kindCode},specs}, customer, salePrice,
landedCostSnapshot, netProfit, soldAt, soldBy{id,name}, warranty, consignmentId, notes,
payments[{accountCode,amount}] (derived from the SALE rows, [] when none),
return{returnedAt,refundAmount,reason,processedBy{id,name}}|null }`.
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
