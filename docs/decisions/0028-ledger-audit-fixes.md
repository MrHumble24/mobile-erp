# 0028 — Ledger audit fixes

Date: 2026-11-05
Status: Accepted

## Context

A security audit of the ledger and the per-phone cost paths (ADR 0024-0027)
found a refund with no cap, cost amounts leaking through the ledger history, a
lost-update window on expense edits, and two smaller gaps.

## Decision

- **Refund cap.** `SalesService.processReturn` rejects (400) a `refundAmount`
  above the sale's net SALE ledger total, or above `salePrice` for a sale with
  no ledger rows. The cap is computed, never trusted from the client.
- **Ledger history cost redaction.** `GET /ledger/transactions` returns
  `amount: null` on cost-type rows (`PURCHASE`, `OVERHEAD`, `DEVICE_EXPENSE`,
  `CUSTOMS` — listed once in `ledger.types.ts`) for a caller without
  `device.cost.view`. The generic interceptor cannot redact a field named
  `amount`, so the ledger service does it. **Balances are unchanged** — a total
  cannot expose a single cost, and that is accepted.
- **Lost-update lock.** The old amount and current account for an expense edit /
  delete, and the before-state of a device unit-expense / customs-fee edit, are
  read **inside** the repository transaction after a `SELECT … FOR UPDATE` on
  the row, so concurrent edits serialize and the ledger never drifts from the
  stored amount.
- **Concurrent opening.** `LedgerService.createEntry` catches the partial-unique
  violation (P2002) from a racing second OPENING and returns 409, not 500.
- **Money bounds.** Ledger entry/transfer amounts, sale price, refund and
  expense amounts gain `@Max(1_000_000_000)` (and `@Min` for signed), matching
  partner payments, so an oversized number is a 400, not a DB error.

## Consequences

- Idempotency keys for expenses / payments / manual entries were judged
  out of scope (online double-click only) and not added.
