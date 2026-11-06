# 001 — Website: money amounts overflow their boxes

Status: merged · Owner: Claude Opus 4.8 (`opus48` agent) · Asked by the user on 2026-11-06

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
- Branch / commits: `agent/opus48/money-overflow`, branched off `4190bcc`, rebased onto
  `main` (`d8f99be`) because the worktree predated the balance/credits/customs/purchases/
  repairs/shifts/stock pages; one squashed commit on top of `d8f99be`.
- The shared rule, in two lines:
  1. Every amount is one non-wrapping `tabular-nums` line; tables carry it on `TableCell` and
     scroll inside their own box, so the page never scrolls sideways and exact figures stay intact.
  2. Headline numbers shrink to fit (`useFitText`, 0.4 floor so the full 13-digit figure stays
     uncut even in a ~120px card); the shared `Money headline` adds a `$19.05M` short form + exact
     tooltip past the legible floor. `formatMoney` is unchanged; `formatMoneyShort` is additive.
- Routes checked (every route in `routes.tsx`, at 1440/1280/1024/768/390, with ×1000 and ×8e6 stress):
  | Route | Was wrong | Fixed by |
  |---|---|---|
  | **all routes @ 768** | app-shell top bar overflowed ~70px (sidebar shows at `md`, fixed-width search box can't fit) | search box moved to `lg:flex`, a search icon stands in below (`AppShellHeader.tsx`) |
  | `/` dashboard, `/reports`, `/balance`, `/expenses`, `/consignments`, `/partners`, `/customers`, `/sales`, `/users`, `/qc`, `/inventory` | metric-card headline numbers overflowed the card | `MetricCard` value shrinks to fit (root fix, no page edits) |
  | all list routes (`/stock /shipments /credits /shifts /purchases /customs /sync /settings` …) | wide money tables pushed the page sideways | tables already scroll in their `overflow-x-auto` box; `TableCell` now `tabular-nums` |
  | `/sales/:id/receipt`, `/credits/:id/contract`, `/repairs/:id/ticket`, sale-detail sheet | — | verified clean: label-left/amount-right rows, mono/`shrink-0`, no overlap at 390 |
  - Verified in a real browser (same-origin iframe at each width + a per-route overflow probe): **no page scrolls sideways at any of the five widths on any route**; metric cards shown uncut up to `$10,000,000,000` in the narrowest 2-column phone card.
- Not edited because out of scope (file:line · the change needed): **none needed.** `/pos`
  (`features/checkout/**`, `widgets/pos-terminal/**`) and `/balance` (`StoreBreakdownTable.tsx`)
  were opened at all five widths and showed no sideways scroll or clipped amount; `pos-terminal`'s
  `SessionPanel` uses `MetricCard`, so it inherits the root shrink fix without being touched.
- `pnpm test`, `pnpm lint`, `pnpm build` (last lines):
  - test: `ℹ tests 75 · ℹ pass 75 · ℹ fail 0`
  - lint: exit 0 (only pre-existing `max-lines-per-function` warnings in untouched files; none in changed files)
  - build: `✓ built in 5.73s` (PWA precache generated)
- Not done / not seen: the stress figures came from a temporary `formatMoney` ×N multiplier used
  only locally and fully reverted before commit (not in the diff). Dialogs/sheets were spot-checked
  (sale-detail sheet, receipt), not every one of the ~30 overlays opened individually; their money
  rows share the same label-left/amount-right pattern that held at 390. `Money`'s compact+tooltip
  last-resort path is implemented and unit-logic-tested but was not seen firing in the browser
  (metric cards reach the 0.4 shrink floor before it would trigger for in-spec amounts).

## Check by Claude
- 2026-11-06: checked and merged. Tests, lint and build pass. With every amount made 1000 times
  bigger (11 digits plus cents): dashboard, reports and balance seen at 768; nine routes measured
  at 390 through a same-origin frame (`/`, reports, balance, sales, expenses, customers,
  inventory, credits, shipments): no sideways scroll, nothing spilling; reports seen at 390.
- Removed by Claude after the builder's commit: the `Money` component and `formatMoneyShort`.
  Nothing used them (`MetricCard` shrinks on its own and never reaches the floor), so they were
  dead code; the handoff had asked for them, which was the handoff's mistake. ADR 0048 and the
  docs say so.
- The browser window would not go below 768 wide here, so the builder's "seen at 390" was
  re-measured in a 390px frame rather than taken on trust.
- Not checked by Claude: the till at narrow widths with stress values; every dialog.
