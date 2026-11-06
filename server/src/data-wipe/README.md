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

take the destructive latch (`DestructiveLockService`, synchronously, before any
await) → confirm (shop name + caller password + "I understand") → refuse if a
backup, restore or erase is running (409) → safety backup via `BackupsService`,
then `verifyBackup` it opens (stop if no passphrase / it fails / it will not
open: nothing erased) → maintenance + erase (one transaction) → end every
session → leave maintenance → record (best-effort past the commit) + Telegram.
Catalog pictures are deleted after commit (the shop logo is never touched). A
run left RUNNING by a crash becomes FAILED at boot (`onModuleInit`). An offline
mutation queued before this erase is refused by the sync push
(`MUTATION_BEFORE_RESET`), so another till cannot replay into the clean shop.

## Must never

- Take a table name, path or SQL fragment from a request.
- Erase users, roles, branches, settings, secrets, backups or the system
  lookups/reference lists (KEPT).
- Run without a verified safety backup, or overlap with a restore (the shared
  latch forbids it), or leave maintenance on after a crash (the transaction
  covers the data; the recovery marker covers the switch).
