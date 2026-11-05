# 0025 — Ledger automatic posting

Date: 2026-11-05
Status: Accepted

## Context

2a (ADR 0024) built the append-only cash/card ledger and `LedgerService.post`.
Balances were right only for manual entries. Step 2b makes every real money
movement post its own row so cash and card are always correct, without any
screen having to remember to.

## Decision

- Six new transaction types (`SALE`, `REFUND`, `PARTNER_PAYMENT`, `PURCHASE`,
  `OVERHEAD`, `EXPENSE`) and five nullable, indexed source links on
  `cash_transactions` (`saleId`, `expenseId`, `partnerPaymentId`, `deviceId`,
  `shipmentId`). Types are seeded **in the migration** too — Railway runs
  `migrate deploy`, which never runs `seed.sql`.
- Each poster calls `LedgerService.post(entry, tx)` inside the **same
  transaction** as the row that moves the money. A sale posts one `SALE` per
  payment line (split payments; absent = one CASH line summing to the price).
- A later change never edits a ledger row — it **posts the difference**: an
  expense amount edit posts the delta, an account move reverses the old and
  posts the new, a soft delete reverses; an overhead edit posts the delta.
- Account is **derived from the ledger rows**, never stored on the expense /
  sale / payment. The shipment's `paymentAccountCode` and the recurring
  template's `accountCode` *are* stored (they own no rows of their own); the
  shipment account is fixed after creation.
- Consignment **settle posts nothing** — a B2B unit brings money in when the
  partner pays (ADR 0008), so posting on settle would double-count.
- Balances now sum in exact `Decimal` and return 2-dp **strings**.

## Consequences

- Nothing is backfilled: rows older than the migration get no ledger rows; a
  later edit of such a row posts only the difference, on CASH.
- No acquisition-cost edit or device-delete path exists yet, so those posters
  (difference / reversal) are specified but dormant. 2c adds the Telegram digest.
