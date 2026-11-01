# 0003 — Schema: no enums, RBAC matrix, identity/profile split, JSONB specs

Date: 2026-11-01 · Status: accepted

## Context
The first schema used six Prisma enums, a single `Role` per user with a `canViewCosts` flag, QC flags and all specs as columns on `devices`, and stored derivable values (`netProfit`, `channel`, `status` on conflicts). Enums (e.g. `ExpenseCategory`) need a migration for every new value and block users from defining their own; the flat tables mixed concerns.

## Decision
- **Enums removed entirely.** Statuses, grades, defect types → lookup tables keyed by `code` (seeded, extendable). Expense categories and roles → runtime-managed tables. `ConflictStatus`/`SaleChannel` dropped: derived from `resolvedAt` / `consignmentId`.
- **RBAC matrix**: `roles` × `permissions` (30 codes, `<resource>.<action>`) via `role_permissions`; users hold many roles (`user_roles`) and per-user grant/revoke overrides (`user_permissions`). Effective = ∪ role perms ∪ grants − revokes.
- **`users` = identity only**; `user_profiles` holds name/phone/locale/avatar.
- **Devices**: `device_models` catalog (brand+name) + `specs JSONB` with GIN index for storage/color/RAM/etc. QC moved to `qc_inspections` + `qc_defects`; transitions logged in `device_status_history`.
- **Sales**: `warranties` and `sale_returns` split out; `netProfit` no longer stored.
- Schema split into `prisma/schema/<domain>.prisma`; reference data in `prisma/seed.sql`; rules in `.agent/rules/database.md`.

## Consequences
- Adding a status, grade, defect or category is an INSERT, not a migration.
- Filtering by storage uses `specs->>'storage'`; `stock_alert_rules.storage` matches that key.
- Permission checks happen in a guard against the effective permission set; role names are never checked in code.
- 30 tables instead of 13; each is single-purpose and small.
