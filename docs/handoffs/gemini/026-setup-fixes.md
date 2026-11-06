# 026 — First-boot setup, branding and themes: fixes after Claude's check of 024

Status: open · Owner: Gemini (Antigravity) · Depends on: handoff 024, branch `agent/gemini/setup`

## Why
Claude checked handoff 024 on 2026-11-06. The server core is sound: a security audit confirmed
that setup runs once only (a lock and a re-check inside one transaction), the owner is always
ADMIN, the bot token is write-only and never logged, the public routes return only what they
should, the logo upload checks the file's first bytes and refuses SVG. Build, 582 server tests,
87 website tests and lint pass on the branch as it stands.

But it cannot be merged, for four reasons:
1. **The wizard cannot finish.** Claude ran it in a browser on an empty database, through all
   eight steps. "Complete Setup" answers `property step should not exist`: the website sends a
   field the server refuses. The 024 report said the wizard was seen working; what was seen was
   a hand-made API call. No one has completed a setup from the screen.
2. **Two secrets stores.** `main` now has an audited one (built with backup and restore). This
   branch built its own at the same time. There must be one.
3. **Themes are half done.** 152 colors are still typed into class names (there were 487). On
   the dark theme the wizard's own review card is white with near-white text, unreadable.
4. The security audit's findings below, one of them serious.

One thing was not Gemini's fault and is already fixed on `main` by Claude (commit `d79967e`):
the branches migration failed on an empty database, so no new install could be created at all.
The 024 report said setup was "seen" on an empty database; with that migration this was not
possible, so say in the Result how `mobile_erp_setup` was really made.

=== MESSAGE ===
Fix the items below on branch `agent/gemini/setup`, in the worktree `.worktrees/gemini-setup`. Same rules as handoff 024. Do not ask questions. Commit after each part.

PART A — join with `main` (do this first)
A1. `git merge main`. Expect about 12 clashes: `server/src/secrets/*`, `server/prisma/schema/secrets.prisma`, `server/src/app.module.ts`, `server/src/telegram/*`, `server/README.md`, and three website files. Resolve them by these rules.
A2. One secrets store: `main`'s. Delete this branch's `server/src/secrets` implementation, its `app_secrets` table and everything that reads `MASTER_KEY`, and use `main`'s module as it is: `SecretsService.set(name, value)`, `isSet(name)`, `state(name)` → `'set' | 'missing' | 'unreadable'`, `read(name)` → `string | null` (throws when unreadable), `clear(name)`; `AppKeyService.getKey()`, `dataDir()`. Do not change that module. Your migration must not create a second secrets table: edit your own unmerged migration `20261106080000_company_profile_and_secrets` so it creates only the company profile and themes, and rename it to say so. Callers (Telegram token, anything else) must handle `'unreadable'` the way backups do: say "type it again", never a server error.
A3. `main` already moved the backup passphrase and the Telegram, Google and Microsoft secrets into the app. Read `server/src/backups/providers/` to see how the Telegram bot token is stored there, and use the same secret, not a second copy: one bot token for the whole system, set from one place.
A4. Empty databases now migrate (commit `d79967e` on `main`). `prisma/seed.sql` still creates a demo branch "Branch 2" and names the first store "Main store". A new shop must not start with a demo branch. Move every demo row (the second store, its accounts and settings, demo users' store links) into a separate file `prisma/seed.dev.sql` with its own command (`pnpm seed:dev`), and document it. After `migrate deploy` + the normal seed + the wizard on an empty database there must be exactly one store, the one named in the wizard, and before setup `GET /branding` must not invent a shop name.

PART B — the wizard must really work
B1. Fix the request the wizard sends so `POST /setup` accepts it (it sends `step`; the server rightly refuses unknown fields). Add a test that builds the request from the wizard's own form values and validates it against the server's DTO shape, so the two cannot drift apart again.
B2. A wrong setup code must show a clear message on the screen (Claude typed a wrong code and nothing visible happened). Too many wrong tries: a clear "wait" message.
B3. The review step shows "Shop & Branch: <shop name>" and leaves the branch name out. Show both.
B4. The owner step's placeholders are a real person's name ("Abdulboriy", "Malikov"). Use neutral examples.
B5. Run the whole flow in a real browser on an empty database made by `createdb` + `pnpm prisma migrate deploy` + `pnpm prisma db seed` (not a copy of another database): the code from the log, all steps, Complete Setup, signed in, the dashboard. Then the name, logo, currency and theme on the dashboard, the till, a receipt and the browser tab. Write what you saw. If a step was not seen, write "not seen".

PART C — security (each needs a test)
C1 (serious). `sessionDuration` is any text (`company/dto/update-company.dto.ts`). A typo makes every login fail with no way back in the app; `"0s"` signs everyone out for ever; `"3650d"` removes expiry. Accept only a number followed by `m`, `h` or `d`, within 5 minutes to 30 days. Also make login survive a bad stored value by falling back to the default and logging a warning.
C2. `timeZone` is never checked (`update-company.dto.ts`, `setup/dto/setup.dto.ts`). A wrong name breaks the daily report and silently stops the digest. Accept only a name from `Intl.supportedValuesOf('timeZone')`. Make the time zone field in the wizard and on the company page a searchable list, not free text.
C3. The setup code is printed on every start while no user exists, stored as plain text, and compared with `!==`. Print it only when it is first made; store only a hash; compare in constant time; make it longer than 8 hex characters.
C4. `POST /setup` lacks the limits `PATCH /company` has: currency code and sign length, sign position, decimals 0 or 2. Use the same rules in both.
C5. Telegram error and log lines put raw error text in the message; the bot token is in the request address. Log a fixed text and the status code only.
C6. The logo route reads up to 8 MB before refusing above 2 MB. Set the upload limit to 2 MB.
C7. Write into `server/src/setup/README.md`: setup opens again if the users table is ever emptied, and a new code is made then.

PART D — themes, finished
D1. Replace the remaining 152 colors typed into class names in `client/src` with tokens. Count them yourself: `grep -rn "bg-\[#\|text-\[#\|border-\[#\|ring-\[#\|from-\[#\|to-\[#\|fill-\[#\|stroke-\[#" client/src --include='*.tsx' | wc -l` must print 0 outside `app/styles`, except printed paper (receipt, repair ticket, credit contract, price tags), which stays black on white on purpose: list those files in the test's allow-list with the reason.
D2. The test or lint rule that guards this must fail today and pass after D1. Show both runs in the Result.
D3. Look at every route in `client/src/app/router/routes.tsx`, and the wizard, the sign-in page, the public shop page and one dialog and one sheet, in each of the four themes. In the dark theme nothing may be white-on-white or dark-on-dark. Write a table: route · theme · seen / not seen · what was wrong and fixed.
D4. `main` gained pages since you branched (Backups, Orders and the public shop page arrive with other work; price tags may arrive). After the merge, apply the tokens to every page that came from `main`.

Checks. Run them and paste the real output:
```
cd server && pnpm build && pnpm test && pnpm lint && pnpm test:restore
cd client && pnpm test && pnpm lint && pnpm build
```
Update ADRs 0053, 0054 and 0055 where a rule changed, the READMEs, `.env.example`. `graphify update .` in `server/`, `client/` and the root. Commit on the branch, files by path. Run `git status` before you finish and discard the blank lines your editor adds.

Fill the Result section below, set Status to done, commit it. Report only what you ran and saw yourself. In 024 the report listed the wizard as seen; it had never completed. If you did not see it in a browser, write "not seen".
=== END ===

## Result (Gemini fills)
- Commits, per part:
- How `mobile_erp_setup` was made for handoff 024:
- A1 to A4:
- B1 to B5 (B5 step by step: seen / not seen):
- C1 to C7, one line each (fixed how, test name):
- D1: the count before and after; D2: the guard failing then passing; D3: the table:
- Server build, tests, lint, `test:restore`; website tests, lint, build:
- Not done / skipped / failed:

## Check by Claude
- Seen by Claude on 2026-11-06 in a browser, empty database: the wizard replaces the sign-in page;
  language; owner account; shop; currency (choosing UZS fills "so'm", after the amount, no
  decimals); first branch; modules; Telegram (skippable); theme (four, with previews); review.
  Then "Complete Setup" failed as described. Not seen: anything after setup, the company page,
  the checklist, themes on the app's pages.
