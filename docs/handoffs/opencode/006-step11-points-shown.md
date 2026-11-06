# 006 — Step 11, part 4 of 6: points shown after the sale

Status: merged · Owner: OpenCode (Big Pickle) · Depends on: 005 (merged)

## Why
Part 4 of the step 11 website work (see 003 for the list of parts). A sale can now be paid partly
with points, but nothing shows it afterwards: the receipt lists only the cash, the sale detail
says nothing, and the report has no points figures. Three small leftovers from parts 2 and 3 are
fixed here too.

=== MESSAGE ===
Show the bonus points of a sale wherever the sale is shown, and fix three small leftovers. Website only: `client/**`. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/opencode/step11-points-shown`, stop and say so. Work only in this folder. Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` first. They are binding (Feature-Sliced Design, React Query only in `model/use-*.ts` hooks, shadcn components from `shared/ui`, one component per file, files ≤300 lines, no new dependency). Then read `docs/decisions/0043-bonus-points.md`, `server/src/sales/types/sale.types.ts` (`SaleBonus`, and the `store` and `receiptFooter` fields of the receipt view) and `server/src/reports/types/reports.types.ts`, so every field name comes from the server and none is guessed.

What the server already returns:
- Every sale (list, detail, receipt): `bonus: { earned: string, spent: string }`, text like `"1450.00"`; `"0.00"` when there are none.
- `GET /reports/profit`: `bonusPointsEarned` and `bonusPointsSpent`, numbers.

Do this:
1. `client/src/entities/sale/model/sale.types.ts`: add `bonus` to every sale type the server sends it on. `client/src/entities/report/model/`: add the two profit fields.
2. The receipt. Find every place a receipt is drawn (`entities/sale/ui/ReceiptPrintView.tsx`, `entities/sale/lib/format-receipt.ts`, `features/checkout/ui/CheckoutReceiptModal.tsx`, `pages/sales/ui/SaleReceiptDialog.tsx`, `pages/sales/ui/SaleReceiptPage.tsx`) and keep one source of truth: the lines are built in one place and every receipt uses it. When `spent` is more than 0, show a "Paid with points" line with a minus sign between the total and the payment lines. When `earned` is more than 0, show a "Points earned" line near the bottom. When both are 0 the receipt is exactly as it is today.
3. The sale detail (`pages/sales/ui/SaleDetailSheet.tsx` and its sections): the same two figures in the money section, each only when more than 0.
4. The profit report overview (`pages/reports/ui/OverviewTab.tsx`): two figures, "Points earned" and "Points spent", shown only when at least one is more than 0. Use the existing `MetricCard`.
5. Leftover from part 2: the till's own customer search, `client/src/features/checkout/ui/CustomerSearch.tsx`, does not show points. Next to the customer's name show the points when `bonusBalance` is not null, the same way `entities/customer/ui/CustomerPicker.tsx` does; reuse its text key. If the same markup is now in two files, move it into one small component in `entities/customer/ui/` and use it in both.
6. Leftover from part 3: on a narrow screen the bar at the bottom of the till (`client/src/widgets/pos-terminal/ui/CartBar.tsx`) and the cart column header (`CartColumn.tsx`, `dueTotal`) show the cart total. They must show the amount to pay after trade-ins and points: use `useCartTenderPlan().amountToPay` from `@/features/checkout`.
7. Leftover from part 3: in `features/checkout/ui/BonusRedeemControl.tsx` the points are printed with a `$` sign. Points are not money: print them with `formatNumber`, not `formatMoney`. Check the same in `TotalsPanel.tsx` ("Points" row) and the customer points panel.
8. Rules that bit earlier parts: the React Compiler is on, so read a form value with `useWatch`, never `form.watch`. Nothing new may be visible on a sale with no points.
9. Text: new keys go into the existing `sales.json`, `reports.json` and `pos.json` under `client/src/shared/i18n/en/`, and the same keys with the same English text under `uz/`. Do not create a new i18n file. Do not write Uzbek. No raw key may show on screen.
10. If the receipt lines are built by a pure function, add or extend its test (`node --test`) with a sale that spent 1000 and earned 1450: both lines are present; and a sale with `"0.00"` and `"0.00"`: neither line is present. Add any new spec to the `test` script in `client/package.json`.

Checks. Run them and paste the real output:
```
cd client && pnpm install && pnpm test && pnpm lint && pnpm build
```
Then `graphify update .` in `client/` and at the repo root (if the command is missing, say so).

Then commit on this branch, adding files by path (never `git add -A`): first the code, then the handoff. **Last time the work was left uncommitted. Do not stop before `git status` shows nothing to commit.** Do not edit `server/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/opencode/006-step11-points-shown.md`, set Status to done, and commit that too. Report only what you ran. You cannot open a browser, so say plainly that the screens were not seen; Claude checks them. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used: Big Pickle (opencode).
- Commits: `650ff54` — Show sale bonus points on receipts, detail and reports;
  plus a follow-up commit for this handoff.
- Files changed: `client/package.json`; `client/src/entities/sale/model/sale.types.ts`
  (`SaleBonus`, `SaleView.bonus`, `ReceiptView.bonus`), `entities/sale/index.ts`,
  `entities/sale/lib/{receipt-bonus.ts,receipt-bonus.spec.ts,format-receipt.ts,combine-receipts.ts}`,
  `entities/sale/ui/ReceiptPrintView.tsx`, `entities/sale/README.md`;
  `client/src/entities/report/model/report.types.ts` (`bonusPointsEarned`,
  `bonusPointsSpent`); `client/src/entities/customer/ui/{CustomerPoints.tsx,CustomerPicker.tsx}`,
  `entities/customer/index.ts`; `client/src/features/checkout/ui/{CustomerSearch.tsx,BonusRedeemControl.tsx,TotalsPanel.tsx}`;
  `client/src/widgets/pos-terminal/ui/{CartBar.tsx,CartColumn.tsx}`;
  `client/src/pages/sales/ui/SaleDetailSections.tsx`, `pages/sales/README.md`;
  `client/src/pages/reports/ui/OverviewTab.tsx`, `pages/reports/README.md`;
  `client/src/shared/i18n/{en,uz}/{sales,reports}.json`.
- `pnpm test`, `pnpm lint`, `pnpm build` output (last lines):
  - `pnpm install`: no changes / up to date.
  - `pnpm test`: `ℹ tests 84`, `ℹ pass 84`, `ℹ fail 0`, `ℹ skipped 0`,
    `ℹ duration_ms 154.7805` (includes the two new receipt-bonus cases).
  - `pnpm lint`: `$ oxlint` then warnings only, exit 0. The warnings are the
    existing long-function/react-compiler ones (including pre-existing entries in
    `BonusRedeemControl`, `TotalsPanel`, `OverviewTab`); no errors.
  - `pnpm build`: `✓ 4152 modules transformed`, `✓ built in 6.33s`, then
    `PWA v2.0.0 ... precache 149 entries (3192.06 KiB)` and generated
    `dist/sw.js` / `dist/workbox-9c191d2f.js`.
- `graphify update .`: ran in `client/` (3405 nodes, 10549 edges) and at the repo
  root (13391 nodes, 26362 edges). The root run skipped `graph.html` because the
  graph exceeds the 5000-node visualization limit; `graph.json` and
  `GRAPH_REPORT.md` were written. Both `graphify-out/` folders are gitignored.
- Not done / skipped / failed: no browser was opened, so the receipt, sale detail
  and profit report screens were **not seen**; Claude checks them. Nothing else
  failed. No server, mobile, PRD, plan, rules or Claude files were touched.

## Check by Claude
- 2026-11-06: checked and merged. Committed this time, report accurate. Tests 84 pass, lint 0
  errors, build passes. One source for the receipt's points lines (`receipt-bonus.ts`), used by
  the printed receipt and the Telegram text.
- Seen in a browser on the sale from part 3 (30,000, 1,000 points spent, 1,450 earned): the
  receipt shows "Paid with points − 1,000" between the total and "Cash 29,000", and "Points
  earned 1,450"; the sale detail shows both rows; the report overview shows Points earned 1,450
  and Points spent 1,000; the till's customer search shows "Outside Walkthrough | 1,450 pts".
- Not seen: the narrow till's bottom bar with points in the cart (read in code only); a receipt
  that combines several lines.
