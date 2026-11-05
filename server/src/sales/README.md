# sales

Retail checkout, warranty, returns, receipts (PRD Module 3). Owns `sales`,
`warranties`, `sale_returns`.

## HTTP

- `POST /sales` (`sale.create`) `{ imei?, serialNumber?, modelId?, quantity?,
  salePrice, payments?[{accountCode,amount}], customerId?, customer?{name,phone},
  warrantyDays?, notes?, clientMutationId?, expectedVersion? }` → `SaleView`.
  Say what is sold **exactly one** of three ways (`sale-target.ts`): `imei`,
  `serialNumber`, or (`modelId` + `quantity`) for a quantity product (400
  otherwise). A **unit** sale resolves the code against imei/imei2/serialNumber
  (ADR 0029); the device must exist (404) and be IN_STOCK (409 — DEFECTIVE is
  not sellable, ADR 0007). A **quantity** sale (ADR 0030): the model must be a
  `QUANTITY` product (400 otherwise), `salePrice` is the **line total**,
  `landedCostSnapshot = quantity × moving-average cost` computed in the checkout
  tx, a `SALE` stock movement posts there, and there is **no warranty**. A DB
  CHECK keeps a sale unit-XOR-quantity. Both are idempotent on `clientMutationId`
  (prior sale returned, rows posted once). `payments` omitted = one CASH line for
  the whole price; present = amounts positive, accounts distinct and active,
  summing to `salePrice` exactly (400 otherwise). One `SALE` ledger row per line
  (ADR 0025).
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
  largest part), never more per account than it took in; a trade-in's value
  and a sale with no ledger rows refund from CASH. ADR 0025. A
  **quantity** sale return restores the whole line: a `RETURN` stock movement at
  the sale's own unit cost (`landedCostSnapshot ÷ quantity`); no device moves.
- `GET /sales/:id/receipt` (`sale.read`) → `ReceiptView` (no cost fields). Carries
  `payments: [{ accountCode, amount }]` (the SALE rows; `[]` when none) so a
  printed receipt can show the cash and card parts, plus `store {name,address,
  phone}` + `footer` for the thermal header (ADR 0043) and `bonus {earned,spent}`.
  The scannable code a receipt needs is the `saleId` (and `items[].imei`);
  price-tag per-level prices come from `GET /pricing/units/:id` + the device view.

`SaleView` = `{ id, device{imei,imei2,serialNumber,model{brand,name,kindCode},specs}|null,
model{brand,name,kindCode}|null, quantity|null, customer, salePrice,
landedCostSnapshot, netProfit, soldAt, soldBy{id,name}, warranty, consignmentId, notes,
payments[{accountCode,amount}] (derived from the SALE rows, [] when none),
return{returnedAt,refundAmount,reason,processedBy{id,name}}|null }`. For a
quantity sale `device` is null and `model`+`quantity` are set (ADR 0030).
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

## Pricing & discounts (ADR 0034)

`POST /sales` also accepts `priceLevelCode?` (default: the customer's level,
else `RETAIL`) and `discount?{mode:'PERCENT'|'AMOUNT',value}`. The server
resolves the line's list price (via `PricingService`) and computes the final
price (`SalesPricingService` + `pricing/lib/checkout-pricing.ts`): `salePrice`
must equal list − discount (400 with the computed figure otherwise); no list
price keeps the old "sent price is the price" behaviour; `sale.price.override`
sends any price; a discount needs `discountsEnabled` + its mode allowed, may not
exceed the list price, and its percent may not exceed max(cashier max, customer
standing) unless `sale.discount.unlimited`. The sync replay path trusts the
till. The sale stores `listPriceSnapshot` + `priceLevelCode`; `SaleView` gains
`listPrice`, `discountAmount` (derived) and `priceLevelCode`. Returns live in
`SalesReturnsService` (split out).

## Cashier shifts (ADR 0036)

When `shiftsEnabled` is on, `POST /sales` is rejected **409 `NO_OPEN_SHIFT`**
unless the caller has an open shift (`ShiftsService.assertCanSell`, called
before target resolution). An offline replay passes `fromSync` and is never
rejected — the sale already happened at the counter.

## Trade-in at the till (ADR 0039)

`POST /sales` also accepts `tradeIns?: [{ modelId, imei?|serialNumber?, imei2?,
specs?, value }]` — phones the customer gives in part payment. A customer (id or
inline) is required, and the caller needs **`purchase.create`** on top of
`sale.create` (taking a phone for value is buying one) — else 403
`code: "TRADE_IN_FORBIDDEN"` (security fix). Each becomes a customer purchase in the **same transaction**
as the sale (reusing `CustomerPurchasesWriteRepository` — one implementation)
and enters stock at `value`, posting **no** ledger row. The sale books its full
`salePrice` (revenue intact); `payments` must sum to `salePrice − Σ values`, so
the cash/card balances move by exactly the tender. Trade-in total above the sale
price → 400 `TRADE_IN_EXCEEDS_SALE`. Online only: refused on the sync replay
path (`TRADE_IN_OFFLINE`) and on credit (`CreditLineDto` has no `tradeIns`).
`SaleView` + `ReceiptView` carry `tradeIns: [{ deviceId, imei, serialNumber,
model, value }]` so clients can print them (the value is customer-facing, not
cost-redacted). `SalesTradeInService` owns validation + the transaction wrap;
the read side (list / lookups / view enrichment with payments + trade-ins) lives
in `SalesReadService`, split from the write orchestration in `SalesService`.

A **return** of a sale that had a trade-in keeps the traded-in phone (its
purchase is never undone); the refund cap is net SALE rows + Σ trade-in values
(ADR 0028 extended). The part **above the money actually paid** (the trade-in
part, refunded in cash) needs `purchase.create`; a caller without it may refund
only the money paid — above that → 403 `code: "TRADE_IN_REFUND_FORBIDDEN"`.

A sale whose unit has since been **bought back** (ADR 0044) can no longer be
returned: `POST /sales/:id/return` refuses 409 `code: "SALE_UNIT_BOUGHT_BACK"`
(the unit is in stock again, maybe re-sold; its warranty ended at buy-back).

## Bonus points (ADR 0043)

`POST /sales` also accepts `bonusRedeem?` (points to spend, online only). It
funds part of the price like the customer's own money: `payments` must sum to
`salePrice − Σ trade-in values − bonusRedeem`. Requires `customerId`, bonus on,
and `bonusRedeem ≤ balance`, `≤ bonusMaxRedeemPercent` of the sale, `≤` what is
left to pay (400 `BONUS_REDEEM_EXCEEDS_*`); points are **not** a discount, so
they never touch the cashier discount limit. On the sync replay path redeem is
refused (`BONUS_REDEEM_OFFLINE`) but earning still happens. `SalesCreateService`
posts the EARN/SPEND rows via `BonusService` inside the sale transaction; a
return reverses them in the refund transaction. `SaleView` + `ReceiptView` carry
`bonus: { earned, spent }`. Checkout orchestration lives in `SalesCreateService`;
`SalesService` is the read/create facade.

## Customer credit (ADR 0035)

`SaleView` carries `creditId` (null for a normal paid sale). `SalesCreditService`
(exported) checks out one credit-cart line through the **same** checkout path as
a normal sale — reusing `SalesCheckoutRepository` inside the credit module's
transaction (`checkout`/`checkoutQuantity` accept an optional outer `tx`) — but
posts **no SALE ledger rows** and stamps `creditId`. A credit sale's return
refunds nothing: `assertRefundWithinSale` caps a no-SALE-row credit sale at 0
(money flows through `CreditPayment`, not here).

## Must never

Store `netProfit`/`channel`/the discount amount; put cost fields in the receipt;
inject another module's repo. Write a second checkout path for credit — reuse
`SalesCreditService`.
