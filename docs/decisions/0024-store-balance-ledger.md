# 0024 — Store balance ledger

Date: 2026-11-05
Status: Accepted

## Context

The store keeps money in two places, cash and card, and needs to see each
balance and every movement. A stored balance number drifts the moment two
writes race or a bug skips one. Step 1 (ADR 0023) anchored every money row to a
store; this is step 2a of the store-balance plan.

## Decision

- One `cash_transactions` row per money movement, **append-only**: no update or
  delete path anywhere. A mistake is fixed by a new row (a CORRECTION).
- `amount` is **signed** (positive = money in, negative = money out, never
  zero; a DB CHECK and the service both enforce non-zero). A balance is the
  `SUM` of rows per account — never a stored column.
- Account and type are **lookup tables** (no enums): `cash_accounts`
  (CASH, CARD; more rows later) and `cash_transaction_types` (OPENING, DEPOSIT,
  WITHDRAWAL, CORRECTION, TRANSFER now).
- A **transfer** is two rows in one transaction sharing a `transferId` (−x on
  the source, +x on the target), so the store total is unchanged.
- At most **one OPENING per store and account**, enforced by a partial unique
  index and the service. Balances may go below zero; nothing is blocked.
- Reads need `balance.read`, writes need `balance.manage`; both granted to the
  owner (ADMIN) only. `LedgerService.post(entry, tx?)` is the single write
  primitive, tx-aware so callers post atomically inside their own transaction.

## Consequences

- 2b adds the SALE/REFUND/PARTNER_PAYMENT/PURCHASE/OVERHEAD/EXPENSE types,
  nullable source-row links, and split payments; each poster calls
  `LedgerService.post` inside its existing transaction. 2c adds the Telegram
  balance digest. Reports and offline sync for ledger rows are out of scope.
