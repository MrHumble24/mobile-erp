# pages/expenses

Route `/expenses` — the operational-expense workspace (PRD Module 5).

## Composes

- Tabs: **Expenses** (summary tiles, filter row, by-category chart, table,
  pagination, detail sheet), **Categories** (manage), **Recurring** (templates
  + generate-due).
- Features: `log-expense` (create/edit), `manage-expense-category`.
- Entity hooks from `entities/expense` and `entities/expense-category`.
- Widget `report-charts/BreakdownBarChart` for the by-category breakdown.

## Owns

- `model/use-expense-filters.ts` — URL-backed filters (period, search, category,
  recorded-by, recurring, amount range, sort) + pagination; the page's single
  source of filter state. Search/min/max are debounced local state → URL.
- `model/recurrence-form.schema.ts` + `ui/ExpenseRecurrenceDialog.tsx` — the
  recurring-template form. Lives here (not a feature slice) by task scope.
- `lib/expenses-csv.ts` — current-page CSV export + `recordedByName`.

## Payment account

The recurring-template form has an `AccountSelect` (default Cash) from
`entities/ledger`; the expenses table and detail sheet show each expense's
`accountCode` via `accountLabel`.

## Must never

- Call `useQuery`/HTTP directly (only entity hooks) or hold server data in state.
