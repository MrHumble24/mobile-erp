# Expenses slice

Shop expenses: summary, filtered list, log-expense and manage-categories.

## Owns
- `/expenses` + `/expense-categories` reads and writes (the only caller).
- Screen state (`ExpensesModel`): the client-only category/recurring filter and
  the loaded list, summary and categories.

## Public API
- `ExpensesModule.feature` — register with one line in `FeatureRegistry`.
  Nav `nav.expenses`, permission `expense.read`.

## Permissions
- `expense.read` — see the section. `expense.manage` — log + delete expenses
  (toolbar `+`, row swipe). `expense.category.manage` — add categories.

## Must never
- Import another feature slice. Edit foundation (`Core/`, `Shared/`, `App/`).
- Queue writes offline — expenses are **not** outbox types. Every write checks
  `connectivity.isOnline` first and shows `common.offline` otherwise.

## Notes
- `AuthedHTTP` is a slice-local DELETE: `Core/APIClient` exposes only GET/POST.
  Remove it when `APIClient` gains `delete`.
