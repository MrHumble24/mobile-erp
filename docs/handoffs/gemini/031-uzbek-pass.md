# 031 — One Uzbek pass: everything that is still English

Status: open · Owner: Gemini (Antigravity) · Depends on: nothing (can run next to 030; different files)

## Why
Claude and OpenCode never write Uzbek, so each feature they built left English text in the `uz`
files. The website and both phone apps read the same files, so one pass fixes all three.
This also closes the old handoff 013 (offline sync) and the never-written 014 (phone strings).

Facts checked by Claude on 2026-11-06:
- 110 keys have the same text in `en` and `uz`: customers 23, repairs 28, pos 18, settings 10,
  inventory 8, setup 7, sales 4, purchases 3, reports 3, sync 2, and one each in backups,
  orders, shifts, storefront. The script `client/scripts/i18n-untranslated.mjs` lists them.
- Six keys the phone apps call do not exist in any file, so the phones show the raw key:
  `common.loadMore`, `common.clear`, `common.offline`, `inventory.selectDevice`,
  `shipments.selectShipment`, `qc.dateRange`.
- The Uzbek for backups and the danger zone was written by Claude models, not by a native
  speaker. It has never been read by one.

=== MESSAGE ===
Translate into Uzbek every text that is still English in the app, and read over the Uzbek that machines wrote. You may edit only `client/src/shared/i18n/**` and this handoff's Result. No code. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/gemini/uzbek-pass`, stop and say so. Work only in the worktree `.worktrees/gemini-uzbek-pass`. Never commit to `main`, never push.

Read `client/src/shared/i18n/GLOSSARY.md` first and use its words. Uzbek in Latin script, the short plain wording a shop cashier uses, the same word for the same thing everywhere (look at how the neighbouring keys in the same file say it).

1. List what is still English:
   ```
   cd client/src/shared/i18n && node ../../../scripts/i18n-untranslated.mjs
   ```
   Then print the keys themselves (change the script's last lines to print them if you need to, but do not commit that change) and translate every one in its `uz/*.json` file.
   - Never change a key name, never change the `en` text, never remove a key.
   - Keep every placeholder exactly as it is: `{count}`, `{points}`, `{name}` and so on.
   - A text that is right to leave as it is (a unit such as `58 mm`, a brand, `IMEI`) stays; list each one in the Result with the reason. Nothing else may stay the same as English.
   - Bonus points: one point is one unit of money, but points are not money. Pick one Uzbek word for "points" and use it in every file; write it into `GLOSSARY.md`.

2. Add six missing keys, to both `en` and `uz`, in the file named by the part before the dot: `common.loadMore` ("Load more"), `common.clear` ("Clear"), `common.offline` ("Offline"), `inventory.selectDevice` ("Select a device"), `shipments.selectShipment` ("Select a shipment"), `qc.dateRange` ("Date range"). English as given, Uzbek by you.

3. Read every `uz` text in `backups.json`, and every `uz` text about the danger zone (erasing data) and about the setup wizard (`setup.json`). Fix what a native speaker would not say, what is unclear, and what is too soft for a warning: the erase warnings must be impossible to misread. List each text you changed, old and new, in the Result.

4. New words you chose go into `GLOSSARY.md`.

Checks, real output pasted:
```
cd client/src/shared/i18n && node ../../../scripts/i18n-untranslated.mjs
cd client && pnpm lint && pnpm build
```
The script's total must equal the number of texts you listed as rightly unchanged.

Commit on this branch, adding files by path (never `git add -A`). Your editor adds blank lines to files it opens: run `git status` before you finish and discard that noise. Do not edit anything outside `client/src/shared/i18n/**` and this handoff.

Fill the Result section of `docs/handoffs/gemini/031-uzbek-pass.md` in THIS worktree, set Status to done, and commit that too.
=== END ===

## Result (Gemini fills)
- Commits:
- Script output before and after:
- Texts left the same as English, each with the reason:
- The word chosen for "points":
- Item 3: texts changed, old → new:
- Lint and build output (last lines):
- Not done / skipped:

## Check by Claude
