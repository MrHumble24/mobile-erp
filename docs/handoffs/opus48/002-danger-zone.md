# 002 — Danger zone: erase the shop's data (server and website)

Status: building · Owner: Claude Opus 4.8 (`opus48` agent), run and checked by Claude · Asked by the user on 2026-11-06 ("clean up everything inside the app, but it should warn us")

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
- Branch / commits:
- The four groups (every table, one line per group):
- Kept rows that pointed at erased rows, and what was done:
- Routes with request and response shapes and error codes:
- Server build, tests, lint, `test:restore`, `test:wipe`; website tests, lint, build:
- Fresh-database check of the migration:
- Browser walk-through, each step: seen / not seen:
- Decisions taken:
- Not done / skipped / failed:

## Check by Claude
