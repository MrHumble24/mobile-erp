# 032 — Website: the till and every dialog at phone width with very large amounts

Status: ready, not started · Owner: Gemini (Antigravity): it needs eyes in a browser · Depends on: nothing

Start: `git worktree add .worktrees/gemini-till-width -b agent/gemini/till-width main`

## Why
Prices here are in the millions. The money overflow fix (`docs/handoffs/opus48/001`, ADR 0048)
covered every page, but two things were left unchecked: the till, which another builder was
changing that day, and most of the roughly 30 dialogs and sheets, which were only spot-checked.
Since then the till also got points, trade-ins and a sticky bar. A cashier on a narrow screen
with an 11-digit total is exactly where a cut-off number costs money.

Facts checked by Claude on 2026-11-06:
- The rules that count as "fixed" are items 1 to 4 under "What fixed means" in
  `docs/handoffs/opus48/001-money-overflow.md`. They are binding here too.
- That handoff's method worked: make every amount 1000 times bigger with a temporary change in
  `formatMoney`, look, fix, and remove the change before committing.
- A browser window on this computer would not go narrower than 768. 390 was measured inside a
  390px-wide frame, or with the browser's device toolbar.
- The till is `client/src/features/checkout/**` and `client/src/widgets/pos-terminal/**`.

=== MESSAGE ===
On the website, make the till and every dialog and sheet hold very large money amounts at phone width. Website only: `client/**` and docs. Not `server/**`, not `mobile/**`. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/gemini/till-width`, stop and say so. Work only in the worktree `.worktrees/gemini-till-width`. Never commit to `main`, never push. Never stop a process you did not start; your own servers: API `CORS_ORIGINS=http://localhost:5190 PORT=3120`, website `VITE_API_URL=http://localhost:3120 pnpm dev --port 5190`.

Read `CLAUDE.md`, every file in `.agent/rules/`, `docs/decisions/0048-money-display.md` and "What fixed means" in `docs/handoffs/opus48/001-money-overflow.md`. Those four rules are the target. In short: the page never scrolls sideways; no amount is cut off, wraps in the middle or overlaps a label; an amount a cashier counts money from is never shortened; only big headline numbers may shrink.

How to see it: in your working copy only, make `formatMoney` multiply by 1000 (11 digits plus cents). NEVER commit that change; check with `git diff` before every commit. Look at 390, 768 and 1024 wide; for 390 use the device toolbar or a 390px frame, a normal window does not go that narrow here.

1. The till, at 390, 768 and 1024, signed in as the owner, with bonus points and discounts switched on in settings:
   - a cart of three lines, one of them a quantity product; a line discount and a cart discount;
   - a chosen customer with points, and points used;
   - a trade-in added;
   - a split payment over two accounts;
   - the totals panel, the amount to pay, the sticky bar at the bottom of a narrow till;
   - the receipt that opens after the sale, at both paper widths (58 and 80). Do not press Print: the print window blocks the browser. Look at the paper on screen.
   Fix what breaks, in the till's own files. Use the shared components and classes ADR 0048 names; do not invent a second way.

2. Every dialog and sheet. First make the list: search `client/src` for every use of the `Dialog`, `Sheet`, `AlertDialog` and `Drawer` components from `shared/ui`. For each one that shows or takes a money amount: open it at 390 with stress amounts, look, fix. One that has no money in it needs only one line in the table: "no money".

3. Do not change what an amount says, only how it fits. No amount in a table, a form, a receipt or a history list may be shortened. No new dependency. Files stay under 300 lines, one component per file.

4. The Result is a table, one row per till state of item 1 and one row per dialog or sheet: where it is and how to open it; seen at 390 (yes or no); what was wrong; the file changed. Write "not seen" for anything you did not look at with your own eyes. A row without "seen: yes" counts as not done.

Checks, real last lines pasted: `cd client && pnpm test && pnpm lint && pnpm build`, and `git diff main -- client/src/shared/lib | grep -n "1000"` must print nothing.

Docs: if you decided something ADR 0048 does not cover, add a line to it. Update the README of a slice only if its public parts changed.

Commit on this branch, adding files by path (never `git add -A`). Your editor adds blank lines to files it opens: run `git status` before you finish and discard that noise. Do not edit `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/gemini/032-till-and-dialogs-phone-width.md` in THIS worktree, set Status to done, and commit that too.
=== END ===

## Result (Gemini fills)
- Commits:
- The table (till states, then every dialog and sheet):
- Test, lint and build output (last lines):
- Proof the stress change is not committed (the grep's output):
- Not done / not seen:

## Check by Claude
