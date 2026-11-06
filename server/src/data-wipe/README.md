# data-wipe

Danger zone: erase the shop's data (ADR 0057) or perform a complete factory reset
returning the system to the first-boot onboarding wizard (ADR 0061). Builds on the
backup feature (safety backup) and the runtime switches (maintenance, sessions,
recovery) — reused through their public services, never copied.

## What it owns

- The table classification (`lib/wipe-tables.ts`): every `@@map` table is in
  exactly one group — ALWAYS, CONTACTS, CATALOG or KEPT. In addition, every KEPT
  table is classified as either reset-erased or never-erased (`wipe-tables.spec.ts`
  verifies exhaustive partitioning).
- The erase and factory reset (`data-wipe.repository.ts`): one transaction, table names
  from compile-time constants **only** (never a request), FK-safe order, no `CASCADE`.
- Orchestration (`data-wipe.service.ts`) and destructive runners (`data-wipe.runner.ts`),
  mirroring restore's step order.
- The audit row `data_wipe_runs` (who, when, groups, rows per table, safety backup id,
  result, and performer email text surviving user deletion) + Telegram notice.

## HTTP (`/data-wipe`, ADR 0045: no store scope)

- `GET /preview` → `{always, contacts, catalog}` (`data.wipe` permission).
- `GET /status` → `{wiping, needsManualRecovery, last}` (`@AllowDuringMaintenance`, `data.wipe` or `data.reset`).
- `GET /runs` → the audit record (`data.wipe` or `data.reset`).
- `POST /` (202, rate limited 3/min, `data.wipe`) → `{shopName, password, understood:true, contacts, catalog}`.
- `POST /reset` (202, rate limited 3/min, `data.reset`) → `{shopName, password, sentence:"erase everything", understood:true}`.

## Order of work

take the destructive latch (`DestructiveLockService`, synchronously, before any
await) → confirm (shop name + caller password + sentence for reset + "I understand") →
refuse if a backup, restore, erase or reset is running (409) → safety backup via
`BackupsService`, then `verifyBackup` it opens (stop if no passphrase / it fails /
it will not open: nothing erased) → maintenance + erase/reset (one transaction) →
end every session → leave maintenance → record (best-effort past the commit) + Telegram.
For reset: all uploads (including logo) are cleared, and `SetupService` generates and logs
a new setup code so the setup wizard opens immediately without server restart.

## Must never

- Take a table name, path or SQL fragment from a request.
- Run without a verified safety backup, or overlap with a restore/erase/reset.
- Leave maintenance on after a crash (the transaction covers the data; the recovery marker covers the switch).
