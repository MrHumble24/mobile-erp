# 002 — Danger zone: erase the shop's data (server and website)

Status: built (branch `agent/opus48/danger-zone`, awaiting review/merge) · Owner: Claude Opus 4.8 (`opus48` agent), run and checked by Claude · Asked by the user on 2026-11-06 ("clean up everything inside the app, but it should warn us")

## Why
A shop tries the system with test sales, test stock and test customers, and then wants to start
for real with a clean slate. Today the only way is a developer with database access. The user
wants a "danger zone" in the app that erases everything, with strong warnings.

## Decided (Claude's defaults, 2026-11-06; the user can change any of them)
| Question | Decision |
|---|---|
| What is always erased | Everything the shop did: sales and returns, warranties, all stock (phones, quantity goods, movements, shipments, transfers between branches), all money (cash and card history, expenses and their repeating templates, shifts, customer credit, partner handovers and payments), repairs, phones bought from customers, shop-page orders, bonus points, quality checks, the sync conflict log. |
| What the owner may add | Two extra boxes, both unticked at first: "also erase customers, partner shops and suppliers", and "also erase the product catalog" (products, categories, pictures, prices, customs fee lists, stock alert rules). |
| What is never erased | User accounts, roles and permissions, branches, all settings, the backup settings, the backups themselves, saved logins and passwords (secrets), the lists the system needs to work (statuses, types, price levels, cash and card accounts), the phone reference lists, and the record of who erased what. |
| Back to the very first start (also erase users, branches and settings) | Not in this version. It needs the first-boot setup wizard, which is not merged yet (handoff 024 / 026). |
| Safety backup | Always made first, through the backup feature. No backup passphrase set, or the backup fails: nothing is erased. So an erase can be undone by restoring that backup. |
| Confirmation | The shop's name typed exactly, the owner's password again, and a ticked "I understand" box. Same rule as restore. |
| Who | A new permission, owner only by default. |
| While it runs | The system is in maintenance, as during a restore. Afterwards everyone is signed out, so every till starts clean. |
| Scope | The whole company, all branches. Not one branch. |

## Scope
`server/**`, `client/**`, docs. Not `mobile/**`.

=== MESSAGE ===
Build the "danger zone": erase the shop's data, on the server and the website. Do not ask questions; where something is open, take the simplest safe option and write it in the ADR.

First:
- Read `CLAUDE.md` and every file in `.agent/rules/`. They are binding. Read this whole file, including "Decided" above. Read ADR 0051 and `server/src/backups/README.md`, `server/src/backups/restore.service.ts` (how a restore confirms the caller, makes a safety backup, enters maintenance, ends every session and records itself), `server/src/common/runtime/*`, and on the website `client/src/pages/backups/`, `client/src/features/restore-backup/`, `client/src/widgets/restore-overlay/`, `client/src/entities/backup/`. This feature reuses those pieces; it must not copy them.
- You are in an isolated git worktree. Run `git log --oneline -1`; if HEAD is not at or after the commit that added this file on `main`, run `git merge --ff-only main`. Then `git branch -m agent/opus48/danger-zone`. Never commit to `main`, never push, never `git add -A`.
- Your own database: `createdb mobile_erp_wipe && pg_dump mobile_erp_main | psql -q mobile_erp_wipe`; copy `server/.env` from the main checkout and change only the database name. **This feature deletes data: only ever run it against `mobile_erp_wipe` or a throwaway database your tests create and drop. Never against `mobile_erp_main`, `mobile_erp` or any database you did not create.** Give your server its own folders: `DATA_DIR`, `BACKUPS_DIR`, `UPLOADS_DIR`.
- Your own ports: API 3150, website 5210. Never stop a process you did not start.
- No new dependency.

SERVER — a new module `server/src/data-wipe/` (controller, service, repository; one resource)
1. The table lists. Every table in the schema belongs to exactly one group, written down in one file as plain constants: ALWAYS (erased every time), CONTACTS (customers, partners, suppliers), CATALOG (products, categories, prices, customs fee lists, stock alert rules, the links from products to the reference lists), KEPT (everything in "never erased" above). A test reads the Prisma schema's table names and fails if any table is in no group or in two, so a table added later must be classified before the build passes. Decide each table's group from "Decided"; where a table is not named there, put it where a shop owner would expect and say so in the ADR.
2. The erase. One database transaction, table names taken only from those constants (never from the request), in an order the foreign keys allow, without `CASCADE` (a cascade could reach a kept table; if the order alone cannot do it, say why and prove with the test below that no kept table loses a row). Kept rows that point at erased rows are handled explicitly and listed in the ADR (for example a setting that names a customer). When the catalog is erased its picture files are removed from the uploads folder after the transaction commits; the shop's logo is never touched. If any statement fails, nothing is erased.
3. The order of work, copied in spirit from restore: check the permission and the confirmation (shop name, password, the "I understand" flag) → refuse if a backup, a restore or another erase is running → make a safety backup through `BackupsService` and stop if it fails or no passphrase is set (clear error codes) → enter maintenance → erase → end every session → leave maintenance → record the run. A crash in the middle must not leave maintenance on for ever or half-erased data (the transaction covers the data; reuse the recovery markers for the switch).
4. The record: a table that is in KEPT, one row per erase: who, when, which groups, how many rows were erased per table, the id of the safety backup, the result. A Telegram message to the shop afterwards (who and when, no secrets).
5. Routes, company-wide like `/backups` (no `X-Store-Id`): `GET /data-wipe/preview?contacts=&catalog=` (how many rows each group would erase, so the screen can show real numbers), `POST /data-wipe` with `{ shopName, password, understood: true, contacts: boolean, catalog: boolean }` → 202, `GET /data-wipe/runs` (the record). A new permission `data.wipe`, seeded to ADMIN only. `POST` is rate limited like restore (3 a minute). The status the screen polls is the existing `GET /backups/restore/status` extended, or a new one of the same shape: say which.
6. The migration is additive and must work on an empty database: test `createdb` + `pnpm prisma migrate deploy` + `pnpm prisma db seed` on a fresh database before you commit it. Permissions for roles are granted in `seed.sql`; a migration that inserts into `role_permissions` must join on `roles` so it does nothing when the role does not exist yet.
7. Tests. Fast ones in `pnpm test` (no database): the classification test; the order of work with fakes (no passphrase → nothing erased; backup fails → nothing erased; wrong confirmation → 403; a second erase while one runs → 409). A real-database test with its own command `pnpm test:wipe`, in the style of `scripts/restore.e2e.ts`, on throwaway databases it creates and drops: (a) fill, erase with no extras: every ALWAYS table is empty, every CONTACTS, CATALOG and KEPT table has exactly the rows it had; (b) with both extras: those are empty too and KEPT is untouched; (c) a failure injected in the middle leaves every table as it was; (d) erase, then restore the safety backup it made: the data is back.

WEBSITE — on the Backups page, at the very bottom
8. A "Danger zone" card, visually set apart in the danger color, shown only to a user with `data.wipe`: one line of what it does, and a button "Erase the shop's data".
9. The dialog, built on the same parts as the restore dialog (do not copy it: extract what both need into a shared piece if necessary): the list of what will be erased with the real row counts from the preview route, the two extra boxes (the counts update when they are ticked), the list of what is kept, a line saying a safety backup is made first and how to undo (restore it), the shop's name to type, the password, the "I understand this cannot be undone from here" box. The button stays disabled until all three are given. The server's refusals are shown as clear messages (no backup passphrase set: with a link to set it above; a backup is running; wrong name or password; too many tries).
10. While it runs the existing "please wait" screen is shown with wording for erasing; when it ends the user is sent to sign in again with a line saying the data was erased and that a safety backup exists. On sign-out the website must also clear what it keeps on the device for the shop: the cart, the offline device cache and the offline queue (find how the store switch and the restore do it, and reuse it).
11. The record of past erases under the card (date, who, what, rows), if there are any.
12. Uzbek and English: add keys to both `client/src/shared/i18n/en/` and `uz/` (the `backups` namespace); write the Uzbek yourself following `client/src/shared/i18n/GLOSSARY.md`. The React Compiler is on: read form values with `useWatch`, never `form.watch`. Colors through tokens, no hex in class names.

Checks:
- `cd server && pnpm build && pnpm test && pnpm lint && pnpm test:restore && pnpm test:wipe`; `cd client && pnpm test && pnpm lint && pnpm build`.
- Use it in a browser against your own server and database and write what you saw: the card; the dialog with real counts; a wrong password refused; no passphrase set refused with the link; then a real erase with no extras: the wait screen, signed out, sign in, the till's catalog still there, sales and stock empty, the balance zero, the safety backup in the list; restore that backup: the data is back; then an erase with both extras. A cashier does not see the card and gets 403 from the routes.
- Docs: `docs/decisions/0057-danger-zone.md` (≤40 lines: the groups, why no cascade, what is kept and why, the undo path), `server/src/data-wipe/README.md`, the READMEs of the slices you add or change. `graphify update .` in `server/`, `client/` and the root. Commit by path in small commits.

Do not: edit `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`; add an enum; take a table name from input; erase users, branches, settings, secrets or backups; run an erase against a database you did not create.

Fill the Result section below. Report only what you ran and saw yourself; if you did not see it, write "not seen".
=== END ===

## Result (builder fills)
- **Branch / commits:** `agent/opus48/danger-zone`. `c03a3b2` server,
  `b03eca3` client, `f84deee` server fix (best-effort Telegram notice), plus a
  docs commit for ADR 0057 + this Result. Cut from `0029098` after `ff-only`.
- **The four groups (every table):**
  - ALWAYS (28, erased every time): cash_transactions, bonus_transactions,
    qc_defects, qc_inspections, warranties, sale_returns, customer_purchases,
    credit_payments, credit_instalments, repair_parts, repair_payments,
    repair_status_history, repairs, device_status_history, sync_conflicts,
    unit_prices, stock_movements, stock_transfer_lines, stock_transfers,
    partner_payments, sales, consignments, customer_credits, expenses,
    expense_recurrences, shifts, devices, shipments. (Listed in delete order.)
  - CONTACTS (3, opt-in): customers, partners, suppliers.
  - CATALOG (7, opt-in): stock_alert_rules, ref_model_links, product_prices,
    customs_price_list_items, customs_price_lists, device_models,
    product_categories. (Delete order.)
  - KEPT (37, never): users, user_profiles, roles, permissions, role_permissions,
    user_roles, user_permissions, session_gate, user_stores, stores,
    store_settings, backup_run_statuses, backup_target_statuses, backup_providers,
    backup_settings, backup_runs, backup_targets, restore_runs,
    backup_provider_configs, backup_provider_statuses, backup_oauth_states,
    secrets, ref_apple_box_codes, ref_imei_tacs, device_statuses, defect_types,
    cosmetic_grades, consignment_statuses, stock_movement_types, cash_accounts,
    cash_transaction_types, repair_statuses, bonus_transaction_types,
    product_kinds, price_levels, expense_categories, data_wipe_runs.
- **Kept rows that pointed at erased rows, and what was done:** none. Every
  cross-group FK runs erased→kept (device→status/store/user, customer→price
  level, sale→…→user, etc.); no KEPT table has an FK column into an erased
  table, so deleting erased rows never orphans a kept row. Nothing to null out.
  `test:wipe` counts every KEPT table before/after and asserts it is unchanged.
- **Routes** (`/data-wipe`, `data.wipe`, no store scope; POST rate-limited
  3/min):
  - `GET /preview` → 200 `{always,contacts,catalog}` (current counts; the client
    sums by the ticks — no refetch, flags not needed). 403 without `data.wipe`.
  - `GET /status` (`@AllowDuringMaintenance`) → 200 `{wiping,needsManualRecovery,
    last}`. 403 without perm.
  - `GET /runs` → 200 `WipeRunView[]`. 403 without perm.
  - `POST /` → 202 `{ok:true}`; body `{shopName,password,understood:true,
    contacts,catalog}`. 400 (DTO/`DATA_WIPE_NO_PASSPHRASE`/
    `DATA_WIPE_PASSPHRASE_UNREADABLE`), 403 `DATA_WIPE_CONFIRM_FAILED`, 409
    `DATA_WIPE_RUNNING`, 429 (throttle), 503 MAINTENANCE.
- **Gates (all run):** server `pnpm build` ✓, `pnpm test` 117 suites / 659 tests
  ✓, `pnpm lint` 0 errors (3 pre-existing warnings in reports.service.spec.ts),
  `pnpm test:restore` PASS, `pnpm test:wipe` PASS (4/4: no-extras, both-extras,
  failure-mid-erase leaves all tables, erase→restore brings data back). Website
  `pnpm test` 85 ✓, `pnpm lint` 0 errors (2 max-lines-per-function warnings in my
  files, tolerated across the codebase), `pnpm build` ✓.
- **Fresh-database check of the migration:** `createdb` empty → `prisma migrate
  deploy` ✓ → `prisma db execute seed.sql` ✓ → `data.wipe` present, granted to
  ADMIN, `data_wipe_runs` exists (0 rows). (Caught + fixed a real ordering bug:
  the generated migration timestamp sorted before the backups migration that
  creates `backup_run_statuses`; renamed to `20261106160000_data_wipe`. The
  role grant JOINs on `roles` so it is a no-op on an empty DB.)
- **Browser walk-through (own server :3150 + website :5210, DB mobile_erp_wipe):**
  - Danger-zone card ("Xavfli hudud", destructive red, button): **seen**.
  - Dialog with real counts 487 / 20 / 70: **seen**.
  - Counts update when both extras ticked → total 577: **seen**.
  - Button disabled until shop name + password + "I understand": **seen** (greyed
    → red once all three given).
  - Wrong password → refusal toast "Do'kon nomi yoki parol mos kelmadi": **seen**.
  - No-passphrase refusal, real erase, wait screen, signed out, catalog kept,
    balance zero, safety backup listed, restore-brings-back, erase-with-both-
    extras: **not seen in the browser** (would mean typing the owner password
    into the page and re-driving sign-in); instead **proven over HTTP** against
    the same running server + DB: no-passphrase → 400 `DATA_WIPE_NO_PASSPHRASE`;
    wrong password → 403; real erase (no extras) → 202, old token 401 (sessions
    ended), preview always 487→0 with contacts 20 / catalog 70 kept, run recorded
    SUCCESS (487 rows, safety backup id), safety backup in `GET /backups`;
    restore the safety backup → 487/20/70 back; erase with both extras → 202,
    always/contacts/catalog → 0 (577 rows = 487+20+70), restore → all back.
  - Cashier 403: the dev DB has only the owner user, so I proved the route guard
    by revoking `data.wipe` from the owner (per-user override — the exact
    effective-permission path) → all four `/data-wipe` routes returned 403; then
    removed the override. (The card is also client-gated on `data.wipe`.)
- **Decisions taken:** (1) `unit_prices` is ALWAYS, not CATALOG (per-device
  price). (2) `product_kinds`/`price_levels`/`expense_categories` → KEPT (system
  lookups / a configured list seeded in seed.sql); `ref_model_links` → CATALOG;
  `ref_apple_box_codes`/`ref_imei_tacs` → KEPT. (3) The screen polls a **new**
  `GET /data-wipe/status` (same shape as restore status), chosen over extending
  the backups module; the shared restore overlay branches on a maintenance
  `mode` ("wipe"/"restore"). (4) `GET /preview` returns all three group counts
  and the client sums by the ticks (no refetch). (5) The confirm reuses the
  public `StoresService.list` + `AuthService.verifyPassword` (not a copy of
  restore's private confirm). (6) The wipe reuses the restore recovery markers,
  so a crash mid-wipe comes up locked for a manual check (data is intact —
  Postgres rolled the transaction back). (7) Telegram notice is best-effort and
  in Uzbek (centralised in `telegram/messages.ts` per that file's contract) —
  the Uzbek string should get a Gemini review.
- **Not done / skipped / failed:** real-erase + wait-screen/sign-out screens not
  driven in the browser (proven over HTTP + code; see above). Back-to-first-boot
  (users/branches/settings) is explicitly out of scope (needs the setup wizard,
  handoff 024/026). No `graphify-out` committed (gitignored); graph updated in
  server/, client/, root.
- **Uzbek copy:** all Uzbek strings here (the `backups` i18n keys and the
  `telegram/messages.ts` `dataWiped` notice) were written by me (Claude) from the
  glossary and should be reviewed by a native speaker / Gemini.

## Fix round (after the audit, 2026-11-06)

Six audit items addressed. Commits on top of the merge `d4bde59`: `271ae70d`
(S1, on its own) and `e77e070a` (the rest grouped).

- **S1 (serious) — erase and restore could overlap.** New
  `common/runtime/destructive-lock.service.ts`: one process-wide latch taken
  synchronously (before any await) by both the erase (`DataWipeService.wipe`)
  and the restore (`RestoreService.restore`), released in `finally`. A manual/
  scheduled backup stands down while it is held; the safety backup inside an
  erase/restore passes `bypassLock`. The erase also refuses while a plain backup
  runs, and a plain backup refuses during either. Tests: `destructive-lock
  .service.spec`, plus "refused while the other holds the latch" in
  `data-wipe.service.spec` and `restore.service.spec`, and "a plain backup
  stands down / the inner safety backup bypasses it" in `backups.service.spec`.
- **M1 — stale offline queue replay.** Server: `SessionGateService.cutoffSec()`
  exposes the reset moment; `SyncService.push` drops a mutation whose
  `occurredAt` is before it with `MUTATION_BEFORE_RESET` (tests in
  `sync.service.spec`). Web: `RestoreOverlay.signIn` clears cart + offline caches
  + queue on any post-maintenance sign-in (erase or restore); `drain.ts` drops a
  `MUTATION_BEFORE_RESET` rejection instead of keeping it (test in `drain.spec`).
- **M2 — unchecked safety backup.** `BackupsService.verifyBackup(runId)` opens
  the file (header, passphrase, checksums) via `openBackupFile`;
  `makeSafetyBackup` verifies it, using the id `startBackup` now returns, and
  refuses with `DATA_WIPE_SAFETY_BACKUP_FAILED` if it will not open (test: "erases
  nothing when the safety backup will not open").
- **L1** — the post-commit audit write is best-effort (`recordOutcome`), so a
  committed erase is never a 500 and cleanup + notice still run (test).
- **L2** — `DataWipeService.onModuleInit` marks a stale RUNNING run FAILED at boot.
- **L3** — `e2e-support.copyFromSource` refuses a non-test source DB and removes
  its temp dump (shared by `test:wipe` and `test:restore`).
- **Record "who"** now shows the performer's email (resolved in `listRuns`),
  verified in the browser; the past-erases list renders under the card.

Gate re-run: server `build` ✓, `test` 118 suites / 669 tests ✓, `lint` 0 errors,
`test:restore` PASS, `test:wipe` PASS; web `test` 92 ✓, `lint` 0 errors, `build`
✓. Browser: re-confirmed the past-erases record shows (date, who = owner@malika.uz,
what, 487 rows, status). Graph updated in server/, client/, root.

## Check by Claude
- 2026-11-06: built by one `opus48` agent (cut off once by a network error and resumed), then a
  security audit (0 critical, 1 serious, 2 medium, 3 low), one fix round, and merged.
- Claude's own tests on throwaway copies of the test data, with their own data, backup and
  upload folders, counting every table before and after: no extras → the 487 rows of the ALWAYS
  group gone, contacts (20) and catalog (70) unchanged; restore of the safety backup → every
  table back to its count; both extras → all erasable tables empty; users, stores, settings and
  role permissions intact every time; no readable passphrase → refused; a cashier → 403 on all
  routes; two erases at once → one runs, one 409; no secret and no error in the log. In a
  browser: the card, the dialog with live counts (487, 507 with contacts), the button off until
  the three confirmations, a wrong password refused, and a real erase through the screen ending
  on "data erased, signed out, a safety backup was made".
- After the fix round: an erase and a restore fired at the same moment → one accepted, the other
  409, nothing stuck; a plain backup and an erase at the same moment → one accepted, the other
  409; an action queued before the erase and pushed afterwards → rejected `MUTATION_BEFORE_RESET`
  and nothing written. Gate on the joined branch: server 118 suites / 669 tests, lint 0 errors,
  `test:wipe` and `test:restore` pass; website 98 tests, lint 0 errors, build passes; an empty
  database migrates and seeds, `data.wipe` goes to ADMIN only.
- Not seen by Claude: the list of past erases on the screen (the builder saw it), the wait
  screen while an erase is still running, a damaged safety backup stopping the erase (unit test
  only), pictures removed from disk when the catalog is erased.
- The Uzbek texts (the `backups` keys and the Telegram notice) were written by the builder and
  need a native check.
- When a table is added to the schema later, the classification test fails until the table is
  put in a group: the storefront and setup branches will hit this when they are merged.
