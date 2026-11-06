# expenses

Operational expense ledger + recurring templates (PRD Module 5).

## Owns

- `expenses`: amount, category, description, vendor (free-text payee),
  isRecurring, incurredAt, recurrenceId (set when spawned from a template),
  createdById (the authenticated user, never the client body), `deletedAt`
  (soft delete). The paid-from account is **not** stored — it is derived from
  the expense's `EXPENSE` ledger rows (ADR 0025).
- `expense_recurrences`: a template (category, amount, vendor, description,
  frequency `monthly|weekly`, nextDueAt, isActive, `accountCode` default CASH).
  ADR 0017.

## Exposes

- REST `/expenses`:
  - `GET` — filters `from`/`to`, `categoryId`, `recordedById`, `search`
    (description+vendor), `minAmount`/`maxAmount`, `isRecurring`; `sort`
    (`incurredAt|amount|createdAt`) + `dir`; paginated. `expense.read`.
  - `GET /summary?from&to` — `{ total, previousTotal, count, byCategory[],
    topCategory, daily[] }` scoped to active store(s). `expense.read`.
  - `GET :id`, `POST`, `PATCH :id`, `DELETE :id` (soft delete) — `expense.manage`.
    `findById` strictly scopes by active store (`storeIds`). Create takes `accountCode?`
    (default CASH); every response carries the derived `accountCode`. Create posts an
    `EXPENSE` row; an amount edit posts the difference, an `accountCode` move reverses
    the old and posts the new, a soft delete reverses — never an edit of a row (ADR 0025).
- REST `/expense-recurrences`: `GET`, `POST`, `PATCH :id`,
  `POST /generate` (spawn all due). Reads `expense.read`, writes `expense.manage`.
  Template stores `accountCode` (default CASH); each spawned expense posts its
  `EXPENSE` row against that account.

## Invariants

- Every read excludes `deletedAt IS NOT NULL` (via `toWhere`).
- `createdById` is the current user; the client cannot spoof it.
- `generateDue` advances one period per call (run again to clear a backlog).

## Must never

- Compute P&L roll-ups — profit lives in `reports`.
- Let `deletedAt` rows leak into a read (see ADR 0017 note on `reports`).
