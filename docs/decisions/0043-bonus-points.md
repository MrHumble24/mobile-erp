# 0043 — Loyalty bonus points (and printing switches)

Date: 2026-11-05
Status: Accepted

## Context

The client wants loyalty points and receipt/price-tag printing, each a switch a
shop turns on or off (store-balance plan, "What we take from CloudShop"). Built
while the user slept; the recommended options are taken and recorded here.

## Decision

- **Settings, off by default.** `bonusEnabled`, `bonusEarnPercent` (share of money
  paid returned as points), `bonusMaxRedeemPercent` (largest share of one sale
  payable with points). Printing (server stores the choice only; printing is
  client work): `receiptPrintingEnabled`, `receiptPaperWidthMm` (58/80, default
  80), `priceTagsEnabled`. One point = one unit of money.
- **Append-only per-customer ledger** (`bonus_transactions`), like the cash
  ledger: a balance is the signed SUM of a customer's rows, never stored. Types
  are a lookup (`bonus_transaction_types`: EARN, SPEND, RETURN, CORRECTION). A
  DB CHECK forbids a zero amount.
- **Earning**: on a paid sale to a named customer, points = earn percent × money
  actually paid (not the points- or trade-in-funded part). A credit sale earns
  nothing (it never calls the bonus poster). A replayed offline sale may earn.
- **Spending** (`POST /sales` `bonusRedeem`): funds part of the price like the
  customer's own money — the cash/card payments must sum to price − Σ trade-ins −
  redeem. The sale still books its full `salePrice`, `listPriceSnapshot` and the
  SPEND row as separate facts. Redeem may not exceed the balance,
  `bonusMaxRedeemPercent` of the sale, or what is left to pay. Points are **not**
  a discount, so they never count toward the cashier discount limit. A
  `customerId` is required. Online only — refused on sync replay
  (`BONUS_REDEEM_OFFLINE`). EARN/SPEND post inside the sale's transaction.
- **Return** posts one RETURN row per original EARN/SPEND with the opposite sign
  (takes back earned, gives back spent), in the refund's transaction; the balance
  may go below zero.
- **Manual CORRECTION** `POST /customers/:id/bonus/adjustments`, permission
  `bonus.adjust` (ADMIN), reason required, signed non-zero amount.
- Report: `GET /reports/profit` gains `bonusPointsEarned` / `bonusPointsSpent`.

## Consequences

- The redeem balance check is read before the sale transaction; a concurrent
  redeem of the same points is a tolerated race at single-shop scale.
- `SalesService` became a read/create facade; checkout moved to
  `SalesCreateService` to stay under the 300-line limit.
