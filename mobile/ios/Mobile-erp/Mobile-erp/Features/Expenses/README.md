# Expenses slice

Shop expenses in three tabs (web parity): **Expenses · Categories · Recurring**.

## Owns
- `/expenses`, `/expense-categories`, `/expense-recurrences` reads and writes
  (the only caller). `ExpensesModel` holds the client-only filters plus the
  paginated list (`KitPaginator`), summary and categories.
- Expenses tab: summary tiles, filter sheet (search, category, recurring,
  date range via `KitDateRangeField`, amount min/max, sort), load-more,
  CSV export (`KitCSVShareButton`), row detail + log/edit/delete.
- Categories tab: add / edit / sort / deactivate with reassign-on-deactivate.
- Recurring tab: list + create/edit, pause/resume, generate-due.

## Public API
- `ExpensesModule.feature` — one line in `FeatureRegistry`. Nav `nav.expenses`.

## Permissions
- `expense.read` — see the section. `expense.manage` — log/edit/delete expenses
  and recurrences. `expense.category.manage` — manage categories.

## Must never
- Import another feature slice. Edit foundation (`Core/`, `Shared/`, `App/`).
- Queue writes offline — expenses are **not** outbox types. Every write checks
  `connectivity.isOnline` first and shows `common.offline` otherwise.

## Notes / deferred
- Write feedback goes through the kit's global `container.toasts`.
- The web "recorded by" filter needs `/users` (Users slice) → deferred to keep
  the slice boundary; all other web filters are present.
