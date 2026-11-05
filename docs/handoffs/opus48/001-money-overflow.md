# 001 — Website: money amounts overflow their boxes

Status: open · Owner: Claude Opus 4.8 (`opus48` agent) · Asked by the user on 2026-11-06

## Why
Prices in this shop are in the millions and tens of millions. On almost every page of the website
the amounts are too long for the place they sit in: they spill out of cards, push table columns
off the page, collide with their labels. The user wants this fixed everywhere, in one pass.

## Scope
Website only: `client/**` and docs. Not `server/**`, not `mobile/**`.

Being changed by other builders right now, so **do not edit** these; if an amount overflows there,
write the file, line and the exact change you would make in the Result, and stop there:
- `client/src/features/checkout/**` and `client/src/widgets/pos-terminal/**` (the till);
- `client/src/pages/balance/ui/StoreBreakdownTable.tsx`.
Everything else in `client/src` is yours for this task.

## What "fixed" means
With amounts up to 13 digits plus cents (`9,999,999,999.99`, also negative), at window widths
1440, 1280, 1024, 768 and 390, on every route in `client/src/app/router/routes.tsx` and in the
sheets and dialogs those pages open:
1. The page never scrolls sideways. A wide table scrolls inside its own box.
2. No amount is cut off, wraps in the middle, or overlaps its label or its neighbour.
3. An amount is never shortened in a table, a receipt, a form, a history list or anything a
   cashier counts money from. Those always show the exact figure.
4. Big headline numbers (metric cards, summary tiles, chart labels) first shrink to fit. Only
   when the smallest readable size still does not fit may they switch to a short form
   (for example `19.05M`), and then the exact amount must be one hover or tap away (tooltip).

## How
- One source of truth. All money text goes through `client/src/shared/lib/format.ts` and, where
  layout matters, through one new shared component in `client/src/shared/ui/` (for example
  `money.tsx`) that owns the rules: no wrapping, tabular digits, shrink-to-fit for headline size,
  the short form with a tooltip as the last resort. Fix `shared/ui/metric-card.tsx` and
  `shared/ui/table.tsx` at the root so most pages are fixed without touching them. Per-page edits
  only where the layout itself is wrong (a flex row without `min-w-0`, a fixed width, a grid that
  cannot reflow).
- No new dependency. CSS first (container queries, `clamp`, `min-w-0`, `whitespace-nowrap`,
  `tabular-nums`, `overflow-x-auto` on the table wrapper). No JavaScript measuring unless CSS
  cannot do it.
- Do not change what `formatMoney` returns for existing callers; add to it, do not alter it.
- The rules in `CLAUDE.md` and `.agent/rules/*.md` are binding: Feature-Sliced Design, shadcn
  components only, one component per file, files ≤300 lines.

## How to look at it
You must look at the pages in a browser; a build that passes proves nothing here.
- API: from the main checkout, without changing it:
  `cd /Users/abdulboriymalikov/projects/mobile-erp/server && CORS_ORIGINS=http://localhost:5196 PORT=3131 node dist/src/main.js`
  (test data only; never reset or migrate the database; ports 3000, 3120, 3130, 5173, 5174, 5190,
  5195 belong to others: never stop a process you did not start).
- Website, from your worktree: `cd client && pnpm install && VITE_API_URL=http://localhost:3131 pnpm dev --port 5196 --strictPort`.
- Sign in as the test owner. The email and password are in `server/.env` of the main checkout
  (`BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`); type them on the local login page, or
  `POST /auth/login` and put `{state:{token,user},version:0}` into `localStorage` under
  `mobile-erp-auth-session`. Never print the password.
- Stress pass: the test data tops out around 20 million. To see 13 digits, temporarily make
  `formatMoney` multiply its input by 1000 on your machine. **Never commit that line.**
- Stop your two servers when you finish.

## Done when
- `cd client && pnpm test && pnpm lint && pnpm build` pass (paste the last lines).
- Every route was opened at the five widths with the stress values and meets points 1 to 4.
- `docs/COMPONENTS.md` describes the new shared component; `docs/decisions/0048-money-display.md`
  (≤40 lines) records the rule in points 3 and 4; READMEs of slices whose layout changed, if they
  describe it.
- `graphify update .` in `client/` and at the repo root.
- Committed on your branch (`agent/opus48/money-overflow`), files added by path, never
  `git add -A`. Never commit to `main`, never push.

## Result (builder fills)
- Branch / commits:
- The shared rule, in two lines:
- Routes checked (route · widths · what was wrong · what fixed it):
- Not edited because out of scope (file:line · the change needed):
- `pnpm test`, `pnpm lint`, `pnpm build` (last lines):
- Not done / not seen:

## Check by Claude
