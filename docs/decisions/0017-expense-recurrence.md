# 0017 — Recurring expenses as templates with a generate-due action

Date: 2026-11-02
Status: Accepted

## Context

PRD Module 5 needs recurring shop costs (booth rent, salaries, utilities) to
be logged every period without re-typing. Two designs were on the table:
a `recurrence` definition table with a "generate due" action, or a lighter
"mark as recurring + duplicate last month" button. The second cannot answer
"what is due next and when", which the module explicitly needs.

## Decision

A standalone `expense_recurrences` table holds the template: category, amount,
vendor, description, `frequency` (`monthly|weekly`), `nextDueAt`, `isActive`,
`createdById`. `POST /expense-recurrences/generate` spawns one real `Expense`
per active template whose `nextDueAt` has passed (incurred at the due date,
`recurrenceId` set, `isRecurring = true`), then advances `nextDueAt` by one
period via the pure `nextDueDate()` helper (month-end days clamp to the
shorter month). `frequency` is a validated `String`, not a Prisma enum or a
lookup table — the set is fixed and binary, so a lookup row would be ceremony.

Soft delete lands on `Expense.deletedAt`: history survives for reports, and
every expenses-module read filters `deletedAt IS NULL`.

## Consequences

- Generation is idempotent per period but advances only one period per call;
  a multi-month backlog needs repeated calls (upgrade: bounded catch-up loop
  or a cron job). No scheduler was added.
- `reports/**` still reads `expenses` without a `deletedAt IS NULL` guard
  (profit, trend, daily-closing, expense report). Those five queries must each
  add `AND "deletedAt" IS NULL` (raw SQL) / `deletedAt: null` (Prisma `where`)
  so soft-deleted rows stop counting. Left to the reports owner — out of this
  task's allowed paths.
