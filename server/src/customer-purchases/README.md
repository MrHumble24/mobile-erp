# customer-purchases

Buying used phones from customers, and trade-in at the till (Change 14, ADR
0039). A second way a unit enters stock besides a supplier shipment. Owns
`customer_purchases`.

## HTTP

- `POST /customer-purchases` (`purchase.create`, ADMIN only by default)
  `{ customerId? | customer{name,phone}, modelId, imei?|serialNumber?, imei2?,
  specs?, pricePaid, accountCode?(CASH), occurredAt? }` → `CustomerPurchaseView`.
  Creates the unit in stock at `pricePaid` (= acquisition + landed cost, no
  customs fee, no shipment), its IN_STOCK status-history row, the purchase
  document, and one `CUSTOMER_PURCHASE` cash row (money out) from the account.
  IMEI/SERIAL kinds only (QUANTITY → 400). Needs an open shift when
  `shiftsEnabled`. **Buy-back (ADR 0044):** if the IMEI/serial belongs to a unit
  we previously **sold**, that same row is resurrected back into stock (new cost
  = pricePaid, SOLD→IN_STOCK with a status-history row, old sale untouched); a
  code that collides with a unit in any other state is still 409.
- `GET /customer-purchases` (`purchase.read`) `?from&to&customerId&search&page&
  pageSize` → `{ items, total, page, pageSize }`. `search` matches a unit's
  IMEI / second IMEI / serial (exact).
- `GET /customer-purchases/:id` (`purchase.read`) → `CustomerPurchaseView`.

`CustomerPurchaseView` = `{ id, customer{id,name,phone}, unit{deviceId,imei,
imei2,serialNumber,model}, pricePaid, accountCode|null, saleId|null, soldBy, occurredAt }`.
`pricePaid` is **redacted** (stripped) without `device.cost.view`; the
`CUSTOMER_PURCHASE` ledger amount is hidden the same way (ADR 0028).

## Public API (for sales' trade-in)

- `CustomerPurchasesWriteRepository.create(input, tx?)` — the one write path,
  reused by a sale's trade-in inside the sale transaction. A trade-in passes
  `saleId` and **no** `ledgerAccountCode`, so it posts no cash row. The trade-in
  caller is gated by `purchase.create` in `SalesTradeInService` (security fix),
  so no unit reaches this write at any cost without the buying permission.
- `CustomerPurchasesService.prepareUnit(dto)` — validate + normalise one unit
  (kind + specs) before the write; `tradeInTotalForSale(id)` and
  `tradeInsBySale(ids)` feed the refund cap and the sale/receipt views.
- `CustomerPurchasesService.wasUnitBoughtBackAfter(deviceId, after)` — true once
  a sold unit has been bought back; `SalesReturnsService` uses it to refuse the
  old sale's return (ADR 0044).

## Must never

- Store passport data — no passport number, document number, ID photo or free
  "document" field, anywhere. The seller is the Customer (name + phone only).
- Undo a trade-in purchase when its sale is returned — the phone stays ours.
- Post a ledger row for a trade-in (its value netted the sale total).
- Expose `pricePaid` unredacted. Reach past `LedgerService` into its repository.
