# data-wipe

Danger zone: erase the shop's data, company-wide (ADR 0057). Builds on the
backup feature (safety backup) and the runtime switches (maintenance, sessions,
recovery) — reused through their public services, never copied.

## What it owns

- The table classification (`lib/wipe-tables.ts`): every `@@map` table is in
  exactly one group — ALWAYS, CONTACTS, CATALOG or KEPT. `wipe-tables.spec.ts`
  reads the schema and fails if a table is unclassified or double-classified.
- The erase (`data-wipe.repository.ts`): one transaction, table names from the
  constants **only** (never a request), FK-safe order, no `CASCADE`.
- Orchestration (`data-wipe.service.ts`) and the destructive section
  (`data-wipe.runner.ts`), mirroring restore's step order.
- The KEPT audit row `data_wipe_runs` (who, when, groups, rows per table,
  safety backup id, result) + a Telegram notice.

## HTTP (`/data-wipe`, `data.wipe`, ADR 0045: no store scope)

`GET /preview` → `{always, contacts, catalog}` (current counts; the client sums
by the ticks, no refetch). `GET /status` → `{wiping, needsManualRecovery, last}`
(`@AllowDuringMaintenance`). `GET /runs` → the record. `POST /` (202, rate
limited 3/min) → `{shopName, password, understood:true, contacts, catalog}`.

## Order of work

confirm (shop name + caller password + "I understand") → refuse if a backup,
restore or erase is running (409) → safety backup via `BackupsService` (stop if
no passphrase / it fails: nothing erased) → maintenance + erase (one
transaction) → end every session → leave maintenance → record + Telegram.
Catalog pictures are deleted after commit (the shop logo is never touched).

## Must never

- Take a table name, path or SQL fragment from a request.
- Erase users, roles, branches, settings, secrets, backups or the system
  lookups/reference lists (KEPT).
- Run without a safety backup, or leave maintenance on after a crash (the
  transaction covers the data; the recovery marker covers the switch).
