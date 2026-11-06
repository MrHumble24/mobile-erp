# 003 — Factory reset: back to the setup wizard

Status: ready, not started · Owner: not assigned. A strong model only (the `opus48` agent or
Claude's `fullstack`); not a free model: this erases everything. · Depends on: nothing

Start: `git worktree add .worktrees/factory-reset -b agent/<owner>/factory-reset main`, own
database (`mobile_erp_reset`), own ports (API 3160, website 5215).

## Why
The danger zone (ADR 0057) erases what the shop did and keeps accounts, branches and settings.
There is no way to hand a used installation to a new shop, or to start over after a bad setup,
without a developer. A factory reset puts the system back to first boot: the setup wizard
(ADR 0053) opens again. ADR 0057 left it out only because the wizard was not merged then.

Facts checked by Claude on 2026-11-06 (read the files, do not re-derive):
- `server/src/data-wipe/` owns the erase: the table groups in `lib/wipe-tables.ts` (a spec fails
  when a table is unclassified), one transaction, no `CASCADE`, the shared destructive latch,
  a verified safety backup first, maintenance, every session ended, the record
  `data_wipe_runs`, and the sync push refusing older offline changes (`MUTATION_BEFORE_RESET`).
- `server/src/setup/`: `GET /setup/status` says `needsSetup` only while zero users exist; then
  the server makes a new one-time setup code and prints it once to its log. `POST /setup`
  makes the owner, the company, the first branch, the ledger accounts and the switches.
- The website page is `client/src/features/wipe-shop-data` on the Backups page.

## Decided by Claude (the user may change any line before this starts)
| Question | Decision |
|---|---|
| What is left afterwards? | The same rows as a new database after `migrate deploy` and the seed: roles, permissions, system lookups, phone reference lists. Nothing else, with the two exceptions below. |
| Exception 1 | The safety backup made by this reset: its file and its run row stay, so the reset can be undone after a new setup. |
| Exception 2 | The reset's own row in `data_wipe_runs`, with the name of who did it kept as text (the account is gone). |
| Secrets (Telegram, Google, Microsoft, backup passphrase) | Erased. The new owner types the passphrase again to restore the safety backup. The server's own app key file stays. |
| Uploads | All deleted, the logo too. |
| How does the owner get back in? | Like first boot: the server prints a new setup code to its log. The dialog says so before the owner confirms. (Alternative, not chosen: show the new code once on screen. Easier for a shop with no server access, but a code on a screen can be photographed.) |
| Who may do it? | A new permission `data.reset`, ADMIN only. Not `data.wipe`. |
| Confirmation | Shop name typed, the caller's password, the sentence "erase everything" typed, and "I understand". One more than the erase. |
| Phone apps | Nothing built. They are signed out like any ended session. |

=== MESSAGE ===
Build "factory reset" in the danger zone: erase everything and return the system to the first-boot setup wizard. Server and website: `server/**`, `client/**`, docs. Not `mobile/**`. Do not ask questions; the "Decided" table in `docs/handoffs/opus48/003-factory-reset.md` is binding, and where something is still open take the safest option and write it in the ADR.

Before anything else run `git branch --show-current`; it must be your `factory-reset` branch, in your own worktree. Never commit to `main`, never push. Never stop a process you did not start. Use your own database and ports, never `mobile_erp_main`, never ports 3000 or 5173.

Read `CLAUDE.md`, every file in `.agent/rules/`, `docs/decisions/0051`, `0053`, `0054`, `0057`, the READMEs of `server/src/data-wipe`, `setup`, `backups`, `secrets`, and all of `server/src/data-wipe/`. Reuse that module's order of work, latch, safety backup, maintenance and record through their existing services. Do not copy them. A second copy of the erase logic is a defect.

1. Classification. Every table that is KEPT today gets one more label: erased by a factory reset, or never erased (roles, permissions, system lookups, reference lists, and the two exceptions in the Decided table). Extend `wipe-tables.ts` and its spec so a new table cannot be left unlabelled. The record of table names stays the only source of what is deleted; nothing from a request ever names a table.

2. The reset. A new action next to the erase: latch → confirm → refuse if a backup, restore, erase or reset runs → safety backup, verified → maintenance → one transaction that deletes everything a factory reset erases, children before parents, no `CASCADE` → delete every upload → end every session → leave maintenance → record. A failure anywhere before the commit erases nothing. After the commit the users table is empty, so setup opens and the server makes and logs a new setup code (make sure that path runs without a restart).

3. The proof, as an e2e test like `pnpm test:wipe`: fill a database, factory-reset it, then compare the row count of EVERY table with a second database that only had `migrate deploy` and the seed. They must be equal, apart from the two exceptions, which the test names. Then run the setup wizard on it, restore the safety backup with the passphrase typed again, and show the old shop is back (count the rows of five tables before and after).

4. Refusals, each with a test: no `data.reset` (403, also for an ADMIN made without it); wrong shop name; wrong password; missing sentence; no backup passphrase set; a backup, restore or erase running; two resets at once (one wins, one 409).

5. Website. In the danger zone, under the erase, a second, clearly separate block "Factory reset", visible only with `data.reset`. Its dialog says in plain words, before anything can be pressed: every account, branch, setting and connection is erased; a safety backup is made first; afterwards the system asks for the setup code from the server's log; the phone apps are signed out. All four confirmations. While it runs: the same progress and maintenance screens the erase uses. When it ends the browser lands on the setup wizard. English text in both `en` and `uz` files; never write Uzbek.

6. A migration is allowed (new permission, the name-as-text column). Test it with `migrate deploy` and the seed on an EMPTY database, and on a copy of a filled one.

7. Docs: ADR `docs/decisions/0061-factory-reset.md` (at most 40 lines), the READMEs of `data-wipe` and `setup`, `server/README.md` where it lists the danger zone.

Checks, real last lines pasted: `cd server && pnpm lint && pnpm test && pnpm test:wipe` plus the new e2e; `cd client && pnpm test && pnpm lint && pnpm build`. Then, in a browser against your own servers: do a factory reset as the owner, read the new setup code from your server's log, finish the wizard, restore the safety backup, sign in as the old owner. Write "seen" or "not seen" per step.

Commit by path (never `git add -A`, never `.env`). Do not edit `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`, `mobile/**`. Fill the Result section of this file, set Status to done, commit it.
=== END ===

## Result (the builder fills)
- Branch / commits:
- The table labels: how many erased by a reset, how many never, and any choice not in the Decided table:
- Lint, tests, e2e (last lines):
- Refusals, one line each:
- Browser walk-through, "seen" or "not seen" per step:
- Not done / skipped / failed:

## Check by Claude
Before merging: the gate; my own reset on a throwaway database with row counts; fail half-way;
restore the safety backup; `security-auditor` on the diff (this is the most destructive route
in the system); empty-database migration check.
