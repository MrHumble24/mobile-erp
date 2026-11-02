# expense-categories

User-managed lookup for expense classification (PRD Module 5).

## Owns

- The `expense_categories` table: name (unique), description, sortOrder,
  isActive (soft-disable; rows are never hard-deleted).

## Exposes

- REST `/expense-categories`: `GET` (list, `expense.read`),
  `POST` + `PATCH :id` (`expense.category.manage`).
- `ExpenseCategoriesService` (exported) — `list()` is reused by the expenses
  module to label per-category summaries.

## Invariants

- Duplicate name → 409 (checked in the service, also enforced by the unique
  index).
- Disabling a category keeps its historical expenses intact.
- Deactivating a category that still has live expenses requires a
  `reassignToId`; the service moves its expenses + recurrence templates there
  first (409 if omitted, 400 if it targets itself).

## Must never

- Hard-delete a category or hold Prisma logic outside the repository.
