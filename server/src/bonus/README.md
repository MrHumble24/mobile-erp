# bonus

Loyalty bonus points (ADR 0043), behind `StoreSettings.bonusEnabled` (off by
default). One point = one unit of money.

## Owns

- `bonus_transactions`: an append-only, per-customer points ledger. A balance is
  the signed SUM of a customer's rows — never a stored column. Types are a lookup
  (`bonus_transaction_types`: EARN, SPEND, RETURN, CORRECTION).

## Public API (`BonusService`)

- `config()` — the store's `{enabled, earnPercent, maxRedeemPercent}`.
- `view(customerId)` — balance + history + config echo (`GET /customers/:id/bonus`).
- `balancesFor(ids)` — batch balances for the POS customer search.
- `summaryBySale(ids)` — points earned/spent per sale, for sale + receipt views.
- `prepareForSale(input)` — validate a redemption, return the `BonusPlan`.
- `postForSale(tx, saleId, plan, paid, by)` — post EARN/SPEND inside the sale tx.
- `reverseForSale(tx, saleId, by)` — a return's reversal, inside the refund tx.
- `adjust(caller, customerId, dto)` — owner CORRECTION (`bonus.adjust`).

## Routes

- `GET  /customers/:customerId/bonus` (`customer.read`)
- `POST /customers/:customerId/bonus/adjustments` (`bonus.adjust`)

## Never

- Store a balance column, edit or delete a row (fix with a new row), post a zero
  amount, or let a sale spend points it has not validated against the balance.
- Reach into another module's repository. Sales inject this service and post
  points inside their own transaction.

## Open questions

- Concurrent redemption of the same points is a tolerated race (single-shop).
