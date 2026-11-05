# 0039 — Buying used phones from customers, and trade-in at the till

Date: 2026-11-05
Status: Accepted

## Context

A unit entered stock only through a supplier shipment. The shop also buys used
phones from walk-in customers, and takes them in part payment at the till
(Change 14; not yet in the PRD — the user owns that file). Built while the user
slept, so the recommended option is taken and recorded here.

## Decision

- **No passport data, anywhere.** Storing it is illegal here. The seller is the
  `Customer` record (name + phone only); `customer_purchases` has no passport,
  document-number, ID-photo or free "document" column, by design.
- New `customer_purchases` (store, customer, device, `pricePaid`, optional
  `saleId`, who, `occurredAt`). One write path (`CustomerPurchasesWriteRepository`)
  shared by the plain buy and trade-in: it creates the unit in stock
  (`acquisitionCost = landedCost = pricePaid`, no customs fee, no shipment —
  `Device.shipmentId` is now nullable), its IN_STOCK status-history row (same
  start as a shipment unit), and the purchase document. Only IMEI/SERIAL kinds;
  QUANTITY is refused 400 (`assertUnitKind`, shared with intake).
- **Duplicate IMEI/serial: 409**, except a sold unit bought back is resurrected in place (ADR 0044).
- **Plain buy** `POST /customer-purchases` posts money **out** via a new
  `CUSTOMER_PURCHASE` cash row (cost type, redacted like other costs) from CASH
  (default) or CARD, linked by `customerPurchaseId`. Needs an open shift when
  `shiftsEnabled` (`ShiftsService.assertCanSell`). Amounts (`pricePaid`, the
  ledger amount) are hidden without `device.cost.view`.
- **Trade-in** `POST /sales` gains `tradeIns[]` (each a unit + `value`). Each
  becomes a customer purchase in the **same transaction** as the sale, posting
  **no ledger row** — no money moved for it. The sale books its full `salePrice`
  (revenue intact); `payments` must sum to `salePrice − Σ values`. Above the sale
  price is refused (400 `TRADE_IN_EXCEEDS_SALE`). A customer is required, and —
  since taking a phone for value is buying one — the caller needs `purchase.create`
  as well as `sale.create` (else 403 `TRADE_IN_FORBIDDEN`; closes the hole where
  a plain cashier banked a made-up trade-in).
- **Returns:** the traded-in phone stays ours (its purchase is never undone);
  the refund cap is net SALE rows + Σ trade-in values (ADR 0028 extended). The
  part above the money actually paid (the trade-in part, refunded in cash) needs
  `purchase.create` (else 403 `TRADE_IN_REFUND_FORBIDDEN`).
- Online only: trade-ins are refused on the sync replay path and on credit
  (credit lines carry no `tradeIns` field; `forbidNonWhitelisted` rejects it).
- Permissions `purchase.create` + `purchase.read` (ADMIN only, seeded in the
  migration and `seed.sql`).

## Consequences

- The trade-in `value` is customer-facing (printed on the receipt / shown on the
  sale), so it is NOT cost-redacted there; only the standalone purchase price
  and the ledger amount are. `Device.shipmentId` nullable: a unit-expense edit
  on a customer-bought unit posts from CASH (no shipment account).
