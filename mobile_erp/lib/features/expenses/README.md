# features/expenses

Shop operating expenses + expense categories (PRD §6 / wave 6).

## Owns
- `/expenses` route (perm `expense.read`): summary card, category + recurring
  filters, expenses table, log-expense dialog, manage-categories dialog.
- `data/` — `ExpensesRepository` (`/expenses`), `ExpenseCategoriesRepository`
  (`/expense-categories`), and the slice models.
- `application/` — filter store + `FutureProvider`s for list, summary, categories.

## Public API
`expenses_module.dart` → `expensesRoutes`, `expensesNavItems`.

## Invariants
- Reads are online (`FutureProvider`). Writes (create/delete expense, create
  category) are **online-only**: gated on `connectivityProvider`, blocked with
  `common.offline` when offline — never queued (expenses are not in the outbox).
- Write actions require `expense.manage` / `expense.category.manage`; the FAB and
  category-add are hidden otherwise.
- Money stays a Decimal-string; display via `formatMoney`.

## Must never
Touch another slice, `app/`, `data/local`, or fake-queue a write offline.
