# expenses

Operational expense ledger + recurring templates (PRD Module 5).

## Owns

- `expenses`: amount, category, description, vendor (free-text payee),
  isRecurring, incurredAt, recurrenceId (set when spawned from a template),
  createdById (the authenticated user, never the client body), `deletedAt`
  (soft delete).
- `expense_recurrences`: a template (category, amount, vendor, description,
  frequency `monthly|weekly`, nextDueAt, isActive). ADR 0017.

## Exposes

- REST `/expenses`:
  - `GET` — filters `from`/`to`, `categoryId`, `recordedById`, `search`
    (description+vendor), `minAmount`/`maxAmount`, `isRecurring`; `sort`
    (`incurredAt|amount|createdAt`) + `dir`; paginated. `expense.read`.
  - `GET /summary?from&to` — `{ total, previousTotal, count, byCategory[],
    topCategory, daily[] }`. `expense.read`.
  - `GET :id`, `POST`, `PATCH :id`, `DELETE :id` (soft delete) — `expense.manage`.
- REST `/expense-recurrences`: `GET`, `POST`, `PATCH :id`,
  `POST /generate` (spawn all due). Reads `expense.read`, writes `expense.manage`.

## Invariants

- Every read excludes `deletedAt IS NOT NULL` (via `toWhere`).
- `createdById` is the current user; the client cannot spoof it.
- `generateDue` advances one period per call (run again to clear a backlog).

## Must never

- Compute P&L roll-ups — profit lives in `reports`.
- Let `deletedAt` rows leak into a read (see ADR 0017 note on `reports`).
