# expenses

Operational expense ledger (PRD Module 5).

## Owns

- The `expenses` table: amount, category, description, isRecurring, incurredAt,
  createdById (set from the authenticated user, never from the client body).

## Exposes

- REST `/expenses`:
  - `GET` — filters `from`/`to` (incurredAt), `categoryId`, `isRecurring`;
    paginated (`page`, `pageSize`). `expense.read`.
  - `GET /summary?from&to` — `{ total, byCategory: [{categoryId,name,total}] }`
    via one aggregate + one groupBy. `expense.read`.
  - `GET :id`, `POST`, `PATCH :id`, `DELETE :id` — writes need `expense.manage`.

## Invariants

- `createdById` is the current user; the client cannot spoof it.
- Category names in the summary come from `ExpenseCategoriesService.list()`.

## Must never

- Compute financial roll-ups beyond a flat summary — profit/P&L live in
  `reports`.
