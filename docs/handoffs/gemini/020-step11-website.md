# 020 — Step 11 on the website: bonus points, printing, buying back a sold phone

Status: split on 2026-11-06 into small parts for OpenCode (`docs/handoffs/opencode/003` to `008`). Gemini does not build this. Kept as the full description of the work.

## Why
The server part of step 11 is in `main` (merge `f9b6307`): loyalty bonus points, printing switches,
buying back a phone the shop sold, and two security fixes. The website has no screens for any of it
yet. This task builds them. Website only. Both this task and branches change `client/`, so it must
start from a `main` that already has branches in it.

=== MESSAGE ===
Build the website screens for step 11. You may edit `client/**` and docs only. Do not edit `server/**`: if the server is missing something, write it in the Result and go on. Do not ask questions; where something is open, take the simplest correct option and write it in the ADR.

First:
- Read `CLAUDE.md` and every file in `.agent/rules/`. They are binding (Feature-Sliced Design, React Query only inside `model/use-*.ts` hooks, HTTP only in `shared/api/http.ts`, Zustand only for client state, shadcn components from `shared/ui`, no native form elements, files ≤300 lines, one component per file).
- Read `docs/decisions/0043-bonus-points.md`, `0044-buy-back-of-a-sold-unit.md`, `0039-customer-purchases-and-trade-in.md`, and `server/src/bonus/README.md`, `server/src/sales/README.md`, `server/src/settings/README.md`, `server/src/customer-purchases/README.md`. For exact shapes read `server/src/sales/types/sale.types.ts` (`SaleBonus`), `server/src/sales/dto/create-sale.dto.ts` (`bonusRedeem`) and `server/src/settings/dto/update-settings.dto.ts`. Do not guess a field name; read it.
- Worktree: `git worktree add .worktrees/gemini-step11-web -b agent/gemini/step11-web main`. Work only there. Never commit to `main`, never push.
- Never stop a process you did not start. Your own servers: API `CORS_ORIGINS=http://localhost:5190 PORT=3120`, website `VITE_API_URL=http://localhost:3120 pnpm dev --port 5190`.
- No new dependency.

What to build:
1. **Settings page** (`pages/settings`), two new sections, saved through the existing settings hook:
   - Bonus points: switch `bonusEnabled`; `bonusEarnPercent` (0 to 100); `bonusMaxRedeemPercent` (0 to 100). The two numbers are shown only while the switch is on.
   - Printing: switch `receiptPrintingEnabled`; paper width `receiptPaperWidthMm` (58 or 80); switch `priceTagsEnabled`.
2. **Customer's points** (only while bonus is on):
   - The till's customer search already receives `bonusBalance` per customer: show it next to the name.
   - Customer detail: balance and history from `GET /customers/:customerId/bonus` (type, amount with sign, date, note, linked sale).
   - "Correct points" dialog for users with `bonus.adjust`: `POST /customers/:customerId/bonus/adjustments` with a signed amount (not zero) and a reason (required).
3. **Paying with points at the till** (`features/checkout`; put new logic in its own files, do not grow the existing ones past the limits):
   - Shown only when bonus is on, a customer is chosen and the till is online. Offline: the field is disabled with a short explanation (the server refuses it on replay, `BONUS_REDEEM_OFFLINE`).
   - A "Pay with points" amount. The most allowed is the smallest of: the customer's balance, `bonusMaxRedeemPercent` of the sale, what is left to pay. Show that limit; a "use maximum" button.
   - Send it as `bonusRedeem`. Cash and card must then add up to price − trade-ins − points. Split payment, trade-in and discounts must keep working together with it.
   - Points cannot be used on a credit sale. Hide the field there.
   - Show the server's refusals as clear messages: `BONUS_DISABLED`, `BONUS_NO_CUSTOMER`, `BONUS_REDEEM_EXCEEDS_BALANCE`, `BONUS_REDEEM_EXCEEDS_DUE`, `BONUS_REDEEM_EXCEEDS_MAX`, `BONUS_REDEEM_OFFLINE`.
4. **After the sale**: the receipt, the sale detail and the sales list detail show points spent and points earned (`sale.bonus`). The profit report shows `bonusPointsEarned` and `bonusPointsSpent` from `GET /reports/profit`.
5. **Printing**:
   - Receipt: when `receiptPrintingEnabled` is on, the receipt has a Print button that prints a narrow receipt at the chosen paper width (58 or 80 mm) with print CSS (`@media print`, `@page`) and `window.print()`. When off, no Print button. The receipt shows the store header fields the sale view now returns (read `sale.types.ts`).
   - Price tags: when `priceTagsEnabled` is on, the inventory and catalog lists get "Print price tags" for the selected rows: product name, storage and color, the walk-in price, and the IMEI / serial / barcode as text. If a barcode picture cannot be drawn without a new dependency, print the code as text and say so in the Result.
6. **Buying back a phone we sold** (ADR 0044): the "Buy a phone" dialog and the trade-in at the till must accept the IMEI of a phone this shop sold. Remove any website check that blocks it. When a sale cannot be returned because its phone was bought back, the server answers 409 `SALE_UNIT_BOUGHT_BACK`: show a clear message. Also show a clear message for `TRADE_IN_REFUND_FORBIDDEN` on a return.
7. **Text**: add every new key to both `client/src/shared/i18n/en/*.json` and `uz/*.json`. You write the Uzbek (Latin) yourself, following `client/src/shared/i18n/GLOSSARY.md` and the words the app already uses. No raw keys on screen.
8. Nothing new is shown while a switch is off. A shop that never turns these on sees the website exactly as before.

Checks:
- `cd client && pnpm lint && pnpm build`.
- Then use the website in a browser against your own servers, signed in as the owner, and write the real numbers:
  a. Turn bonus on, earn 5%, max redeem 50%. Sell a 100,000 item to a named customer for cash: the customer has 5,000 points.
  b. Sell another 100,000 item to the same customer and pay 5,000 with points: cash due is 95,000; the balance afterwards is 0 + 5% of 95,000 = 4,750.
  c. Try to pay with more points than allowed: the field refuses or the server message is shown.
  d. Return the sale from (b): the points come back as the ADR says. Write the balance you see.
  e. Correct the customer's points by +1,000 with a reason: it shows in the history.
  f. Turn receipt printing on, 58 mm, open a receipt, open the print preview. Then 80 mm. Turn it off: no Print button.
  g. Turn price tags on, print tags for two phones.
  h. Sell a phone, then buy it back in "Buy a phone" with the same IMEI: it is in stock again. Try to return the first sale: the clear message is shown.
  i. Turn every switch off: none of the new things are visible.
- Docs in the same commits: `docs/decisions/0047-client-bonus-printing-buyback.md` (≤40 lines), the README of every slice you added or whose public API changed. `graphify update .` in `client/` and at the repo root (if the command is missing, say so).
- Git: add files by path (never `git add -A`, never `.env`). Your editor adds a blank line to the end of files it opens: run `git status` before you finish and discard those. Do not merge, do not push.

Do not: edit `server/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/gemini/020-step11-website.md` and set Status to done. Report only what you ran and saw; paste the real command output. If a step failed or was skipped, say so plainly.
=== END ===

## Result (Gemini fills)
- Branch / commits:
- Website lint and build output:
- Browser walk-through, steps a to i, what was seen and the numbers:
- Decisions taken:
- Server gaps found (not fixed):
- Not done / skipped / failed:

## Check by Claude
