# manage-expense-category

One user action: create, edit, or deactivate an expense category.

## Public API

- `ExpenseCategoryDialog` — create (no `category`) or edit (pass `category`).
  Uses `useCreateExpenseCategory` / `useUpdateExpenseCategory`.

## Owns

- `model/category-form.schema.ts` — locale-aware zod schema + DTO mappers.
- `ui/CategoryFormFields.tsx` — fields; when deactivating a category in use it
  reveals a "move expenses to" `Select`. A 409 from the server (expenses exist,
  no target) surfaces as an inline error on that field.

## Must never

- Talk HTTP directly or render native form controls.
