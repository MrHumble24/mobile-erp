# 0044 — Buying back a unit the shop sold before

Date: 2026-11-05
Status: Accepted

## Context

ADR 0039 deferred the most common trade-in there is: buying back a phone this
shop sold. Its IMEI/serial already exists, so both `POST /customer-purchases`
and a trade-in refused it with 409. Built while the user slept; the recommended
option is taken and recorded here.

## Decision

- **Resurrect the same unit.** When a buy-back's IMEI/serial collides with a unit
  that is **SOLD** (not in stock, consigned, defective or returned),
  `CustomerPurchasesWriteRepository` brings **that same row** back into stock
  instead of 409: new `acquisitionCost = landedCost = pricePaid`, `customsFee`
  and `unitExpense` reset to 0, `statusCode = IN_STOCK`, `version += 1`, a
  `device_status_history` row (SOLD→IN_STOCK, reason "bought back"), linked to
  the new purchase. Any other existing status is still a 409. One shared write
  path, so a plain buy and a trade-in both do this.
- **The old sale is untouched.** It froze its own `landedCostSnapshot`,
  `salePrice` and `listPriceSnapshot`, so every past report (sales, profit,
  warranty, returns) stays exactly as it was. Nothing there reads the unit's live
  cost or status for a sold unit — only the resurrected row's live fields change.
- **Warranty ends at buy-back.** The resurrect ends any still-active warranty on
  the unit's prior sales at the buy-back moment (`warranty.updateMany`).
- **No more return.** A sale whose unit has since been bought back can no longer
  be returned: `SalesReturnsService` refuses with 409
  `code: "SALE_UNIT_BOUGHT_BACK"`, detected by a customer purchase of the sold
  unit at/after the sale (`CustomerPurchasesService.wasUnitBoughtBackAfter`).
- **Round and round.** A unit may be sold, bought back, sold and bought back
  again — each buy-back resurrects the same row (proven by a test).

## Consequences

- `warrantyLookup` already returns the most recent sale of a unit, so after a
  buy-back + re-sale it reflects the new sale; the old sale's warranty is ended.
- Security: a buy-back trade-in goes through the same `purchase.create` gate as
  any trade-in (ADR 0039 fix); the gate also guards resurrecting a unit at any
  cost.
