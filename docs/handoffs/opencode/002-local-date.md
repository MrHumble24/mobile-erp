# 002 — Website: "today" is the wrong day after midnight

Status: open · Owner: OpenCode (model: Big Pickle, a trial task) · Depends on: nothing

## Why
The shop is in Tashkent (UTC+5). The website works out "today" with `toISOString()`, which gives
the UTC day. Between 00:00 and 05:00 local time that is yesterday, so "Today" and "Last 30 days"
filters miss everything made after midnight (seen on the Balance page on 2026-11-06). "Last month"
is wrong at any hour: it ends one day early. Small task, website only. It is also a trial of the
model: Claude checks the result before anything is merged.

=== MESSAGE ===
Fix how the website works out local dates. Website only: `client/**`. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/opencode/local-date`, stop and say so. Work only in this folder. Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` first. They are binding (one source of truth, Feature-Sliced Design layers, files ≤300 lines, no new dependency).

The bug: `client/src/shared/lib/date-range.ts` has `const iso = (d) => d.toISOString().slice(0, 10)`. That is the UTC day, not the user's day. In Tashkent at 00:30 on 6 November it returns `2026-11-05`.

Do this:
1. New file `client/src/shared/lib/local-date.ts` with small pure functions, each taking the date as a parameter so it can be tested:
   - `localIsoDate(d: Date): string`: `yyyy-mm-dd` of `d` in the user's timezone.
   - `todayIso(now: Date = new Date()): string`.
   - `localDayStart(date: string): string | undefined` and `localDayEnd(date: string): string | undefined`: the UTC instant of the start (00:00:00.000) and the end (23:59:59.999) of that local day; `undefined` for an empty string.
2. `date-range.ts`: use `localIsoDate`. Give `presetDates` an optional last parameter `now: Date = new Date()`. All presets must be right: today, 7d, 30d, month, lastMonth.
3. Remove the copies and use the shared functions:
   - `localDayStart` / `localDayEnd` copied in `pages/balance/model/use-balance-filters.ts` and `pages/shifts/model/use-shifts-filters.ts`.
   - `todayIso` copied in `features/log-expense/model/expense-form.schema.ts`, `features/record-ledger-entry/model/ledger-entry.schema.ts`, `pages/expenses/model/recurrence-form.schema.ts`.
   - `new Date().toISOString().slice(0, 10)` in `features/intake-shipment/ui/ShipmentCreateForm.tsx`, `features/create-price-list/model/create-price-list.schema.ts`, `pages/reports/ui/ClosingTab.tsx`, and the three CSV file names in `pages/customers/lib`, `pages/sales/lib`, `pages/expenses/lib`.
   Search for any other place that does the same and fix it too.
4. Leave `client/src/entities/credit/lib/credit-plan.ts` alone. It uses UTC days on purpose.
5. Test file `client/src/shared/lib/local-date.spec.ts` in the same style as `unit-code.spec.ts` (`node --test`), added to the `test` script in `client/package.json`. It must pass on a machine in any timezone, so make the test itself run as `Asia/Tashkent`. Cases, with `now = 2026-11-05T19:30:00Z` (00:30 on 6 November in Tashkent):
   - `todayIso(now)` is `2026-11-06`.
   - `presetDates("today", "", "", now)` is `2026-11-06` to `2026-11-06`.
   - `"7d"` is `2026-10-31` to `2026-11-06`; `"30d"` is `2026-10-08` to `2026-11-06`.
   - `"month"` is `2026-11-01` to `2026-11-06`; `"lastMonth"` is `2026-10-01` to `2026-10-31`.
   - `"custom"` returns the two strings it was given.
   - `localDayStart("2026-11-06")` is `2026-11-05T19:00:00.000Z`; `localDayEnd("2026-11-06")` is `2026-11-06T18:59:59.999Z`; both give `undefined` for `""`.
   - One more `now` in the afternoon (`2026-11-06T10:00:00Z`): today is `2026-11-06`, lastMonth still ends `2026-10-31`.

Checks. Run them and paste the real output:
```
cd client && pnpm install && pnpm test && pnpm lint && pnpm build
```
Then `graphify update .` in `client/` and at the repo root (if the command is missing, say so).

Commit on this branch, adding files by path (never `git add -A`). No ADR is needed. Do not edit `server/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/opencode/002-local-date.md`, set Status to done, and commit that too. Report only what you ran. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used:
- Commit:
- Files changed:
- Other places found and fixed:
- `pnpm test`, `pnpm lint`, `pnpm build` output (last lines):
- Not done / skipped / failed:

## Check by Claude
