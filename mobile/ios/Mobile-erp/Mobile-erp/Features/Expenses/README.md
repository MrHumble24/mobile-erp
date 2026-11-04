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

## Warm Card (ADR 0022)
- `ExpensesView` switches its three tabs with the kit `SegmentedControl` and is
  titled by `nav.expenses`. The list tab is `ScrollView` + `AppCard` rows with the
  system search bar, filter / new / CSV in the toolbar and a `MetricList` summary
  (period total, count, per-category rows). Categories are one card of hairline
  rows; recurring templates are cards with edit / pause pills.
- Every sheet (detail, log/edit, recurrence, category) is the kit sheet:
  `SheetTitleRow`, `AppFormField` + `AppTextField` / `AppSelect` /
  `SegmentedControl` / `AppDateField` / `Toggle`, pill buttons (delete =
  destructive). The filter sheet is a kit `FilterSheet`. The old
  `ExpensesSummaryCard` and `ExpenseDate` helper are gone (`KitDate` instead).
- DEBUG screenshot args: `-open expenses`, `-openTab expenses|categories|recurring`,
  `-openExpense first`.

## Notes / deferred
- Write feedback goes through the kit's global `container.toasts`.
- The web "recorded by" filter needs `/users` (Users slice) → deferred to keep
  the slice boundary; all other web filters are present.
