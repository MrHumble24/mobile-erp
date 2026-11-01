## Database & Prisma schema rules (server/prisma/schema/*.prisma)

**No enums.** Prisma/Postgres enums force a migration for every new value and lock the business into the developer's list.
- Closed-but-growing sets (statuses, grades, defect types) → lookup table keyed by a stable `code String @id`, with `label`, `sortOrder`, `isActive`, and `isTerminal` where it is a state machine. Seed in `prisma/seed.sql`.
- User-managed sets (expense categories, roles) → table with `id uuid` + `@unique` name/code; admins add rows at runtime.
- Binary states → a nullable timestamp, not a flag or enum: `resolvedAt`, `returnedAt`, `deletedAt`.
- The only Prisma `enum` allowed is none. If you think you need one, add a lookup table.

**Derive, don't duplicate.** A column that can be computed from other columns is a bug waiting for drift: no `netProfit`, no `channel` when `consignmentId` tells you, no `isDefective` when inspections exist. Snapshots that freeze history (`landedCostSnapshot`) are the exception and must say so in their name.

**Identity ≠ profile ≠ access.**
- `users`: credentials and account state only.
- `user_profiles`: human-facing data (name, phone, locale, avatar).
- RBAC is a matrix: `roles` × `permissions` via `role_permissions`; `user_roles` (many); `user_permissions` per-user grant/revoke override. Never put `canX Boolean` on `users` — add a permission code.
- Permission codes are `<resource>.<action>`; checking is done in a Nest guard against the effective set, never against a role name.

**Open-ended attributes → JSONB.** Specs, payloads, free-form settings live in one `Json @db.JsonB` column with a GIN index, documented with an example shape in the schema comment. Columns stay relational when they are identity (`imei`), FK, money, or something you sort/filter on daily.

**One concern per table.** Device holds the unit; QC results are `qc_inspections` (many per device); status changes are `device_status_history`; warranty and returns are their own tables off `sales`. If a table has two groups of columns that change at different times, split it.

**Multi-file schema.** One `.prisma` file per domain in `prisma/schema/`; `base.prisma` holds generator/datasource. No file over 150 lines.

**Conventions.** `uuid` ids for business rows, `code` ids for lookups; `@@map` to snake_case; money `Decimal(14,2)`; every FK indexed; `onDelete: Cascade` only for owned children (profile, history, join rows).

**Changing the schema** = `prisma migrate dev --name <what>` + update `seed.sql` if a lookup changed + update the ADR or module README that describes the domain.
