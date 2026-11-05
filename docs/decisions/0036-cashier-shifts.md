# 0036 — Cashier shifts (optional)

Date: 2026-11-05
Status: Accepted

## Context

The cashier counts the drawer cash at the start and end of the day (Change 11
in the store-balance plan; not yet in the PRD — the user owns that file).
Shifts are optional, one per cashier, and a closing difference must never be
hidden: it is saved with the shift and posted to the store balance so the
balance always matches the real cash.

## Decision

- One `shifts` table (store, cashier, openedAt, openingCount, closedAt,
  closingCount, note). An **open** shift has no `closedAt` — no status column.
  At most one open shift per cashier, enforced by a partial unique index
  (`WHERE closedAt IS NULL`, in the migration) and the service.
- **Nothing derivable is stored.** What happened during a shift is every cash
  ledger row the cashier posted in the window, in that store. Expected cash =
  opening count + net of those rows on CASH; difference = counted − expected.
  All of it is one pure function (`shifts/lib/shift-math.ts`, spec'd); the
  report's sections are groupings of the same rows.
- **Opening posts nothing** (the money was already in CASH). **Closing** posts
  the difference, when non-zero, as one `SHIFT_DIFFERENCE` cash row on CASH
  (positive = counted more than expected) linked via `cash_transactions.shiftId`,
  in the same transaction that closes the shift. That row is never counted as a
  movement (it reconciles) — the pure summary always drops it.
- Setting `shiftsEnabled` (default false). When on, `POST /sales` and
  `POST /credits` without an open shift are rejected **409 `NO_OPEN_SHIFT`**
  (a code, not prose). Offline replays (`fromSync`) are trusted and never
  rejected. Nothing else requires a shift.
- Routes: current (live), open, close (own) need `sale.create`; list and report
  need `sale.read` (own only; `shift.manage` sees all and can force-close
  another cashier's shift). `shift.manage` is ADMIN-only, seeded in the
  migration and `seed.sql`; so is the `SHIFT_DIFFERENCE` lookup row.

## Consequences

- Card is never counted by hand; only cash feeds expected. Fixing a wrong count
  is an ordinary balance correction (no reopen/edit path). A sale committing in
  the tiny window between reading rows and closing lands in the shift's own
  report on the next read, not the next shift's.
