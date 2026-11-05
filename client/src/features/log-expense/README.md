# log-expense

One user action: record or edit an operational expense.

## Public API

- `LogExpenseDialog` — create (no `expense`) or edit (pass `expense`). Calls
  `useCreateExpense` / `useUpdateExpense` from `entities/expense`.

## Owns

- `model/expense-form.schema.ts` — locale-aware zod schema (amount > 0, date
  not in the future, category required) + DTO mappers.
- `ui/ExpenseFormFields.tsx` — the shadcn `Form` fields, incl. the category
  `Select` fed by `entities/expense-category` and the `AccountSelect` (default
  Cash) from `entities/ledger`.

## Must never

- Talk HTTP directly (only through entity hooks) or render native form controls.
