# 005 — Step 11, part 3 of 6: paying with points at the till

Status: open · Owner: OpenCode (Big Pickle) · Depends on: 004 (merged)

## Why
Part 3 of the step 11 website work (see 003 for the list of parts). The server accepts
`bonusRedeem` on `POST /sales` (ADR 0043). The till sends one `POST /sales` per cart line, so the
points the customer spends on a cart must be shared out over its lines, the same way trade-ins and
split payments already are. This is money logic: the rules and the test numbers are given exactly.

=== MESSAGE ===
Let a customer pay part of a sale with bonus points at the till. Website only: `client/**`. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/opencode/step11-pay-with-points`, stop and say so. Work only in this folder. Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` first. They are binding (Feature-Sliced Design, React Query only in `model/use-*.ts` hooks, shadcn components from `shared/ui`, no native form elements, one component per file, files ≤300 lines, no new dependency). Then read `docs/decisions/0043-bonus-points.md`, `server/src/bonus/lib/bonus-math.ts` (the server's limits), `client/src/features/checkout/README.md`, and in `client/src/features/checkout/`: `lib/payment.ts`, `lib/trade-in-plan.ts`, `model/use-trade-in-plan.ts`, `model/use-checkout.ts`, `ui/TotalsPanel.tsx`, `ui/PaymentPanel.tsx`.

How the server decides, per sale (one cart line is one sale). `bonusRedeem` must not be more than:
- the customer's points balance;
- `maxRedeemPercent` of that sale's price, rounded to 2 decimals, half up;
- what is left to pay on that sale: its price minus the trade-ins on it.
Cash and card for that sale must then add up to price − trade-ins − `bonusRedeem`. Refusals come back with a `code`: `BONUS_DISABLED`, `BONUS_NO_CUSTOMER`, `BONUS_REDEEM_EXCEEDS_BALANCE`, `BONUS_REDEEM_EXCEEDS_MAX`, `BONUS_REDEEM_EXCEEDS_DUE`, `BONUS_REDEEM_OFFLINE`.

Do this, all inside `client/src/features/checkout/` unless a file is named:

1. `lib/bonus-redeem.ts`, a pure function with no React, all sums in integer cents like `lib/payment.ts`:
   ```ts
   export interface RedeemLine { lineId: string; price: number; due: number } // price: the line's total; due: price minus its trade-ins
   export interface RedeemPlan {
     max: number                      // the most the customer may spend on this cart
     total: number                    // what will be spent: requested, kept between 0 and max
     byLine: Record<string, number>   // lineId -> points on that line (only lines with points)
     payableLines: LinePrice[]        // per line: due minus its points; what cash/card must cover
   }
   export function planBonusRedeem(lines: RedeemLine[], requested: number, balance: number, maxPercent: number): RedeemPlan
   ```
   Rules: a line's cap is the smaller of (price × maxPercent / 100, rounded to cents half up) and its due. `max` is the smaller of the balance and the sum of the caps. `total` is `requested` kept between 0 and `max` (a negative or not-a-number request is 0). Share `total` out in cart order: each line takes as much as its cap allows until nothing is left.
2. `lib/bonus-redeem.spec.ts` (`node --test`, same style as `lib/payment.spec.ts`), added to the `test` script in `client/package.json`, with exactly these cases:
   - one line, price 100000, due 100000; balance 5000; max 50; requested 5000 → max 5000, total 5000, byLine 5000, payable 95000.
   - one line 100000; balance 200000; max 50; requested 80000 → max 50000, total 50000.
   - two lines, 100000 and 40000 (due the same); balance 60000; max 50; requested 60000 → byLine 50000 and 10000; payable 50000 and 30000.
   - one line, price 100000, due 30000 (a 70000 trade-in); balance 90000; max 50; requested 90000 → max 30000, total 30000, payable 0.
   - balance 0, or max 0 → max 0, total 0, payable equals due.
   - one line, price 333.33; balance 1000; max 50; requested 1000 → max 166.67.
   - requested −5 and requested NaN → total 0.
3. `model/bonus-redeem.store.ts`: a small Zustand store, not persisted: `requested: number`, `setRequested(n)`, `reset()`. `cart.store.ts` is already 259 lines: do not put this in it.
4. `model/use-tender-plan.ts`: `useCartTenderPlan()` and a non-hook `buildCartTenderPlan(...)` for the submit. It takes the existing trade-in plan (`buildCartTradeInPlan`) and applies `planBonusRedeem` on top, using each line's total and its `payableLines` amount as `due`. It returns the trade-in plan, the redeem plan, the final `payableLines` and `amountToPay` (after trade-ins and points). The points allowed are 0 unless all are true: the cart customer has an `id`; `useCustomerBonus(customerId)` from `@/entities/bonus` says `enabled`; the till is online (`useOnlineStatus` from `@/shared/lib/offline`).
5. Use the tender plan wherever the amount to pay is used today:
   - `ui/PaymentPanel.tsx` (`total`), `ui/TotalsPanel.tsx` (a "Points" row with a minus sign when points are used, and the amount to pay);
   - `client/src/widgets/pos-terminal/model/use-pos-terminal.ts`: `isPaymentBlocked` must get the tender plan's `payableLines`, so a split must add up to the amount after points. Export what the widget needs from the feature's `index.ts`.
   - `ui/TradeInSection.tsx` keeps using the trade-in plan.
6. `model/use-checkout.ts`: build the tender plan from the store snapshot. For the bonus numbers read the already loaded answer with `queryClient.getQueryData(bonusKeys.detail(customerId))`; if it is not there, no points are used. Build the payments from the tender plan's `payableLines`. For each line with points set `dto.bonusRedeem`. Add `bonusRedeem?: number` to `CreateSaleDto` in `client/src/entities/sale/model/sale.types.ts`. A sale with points is never queued for offline: on a network error surface the failure, exactly as the code already does for trade-ins. After a successful checkout reset the redeem store and invalidate the customer's bonus query and the customer lookup queries.
7. `ui/BonusRedeemControl.tsx`, one component, mounted in `TotalsPanel.tsx` above the payment panel: shown only when the plan's `max` is more than 0. It shows the customer's balance, the most that can be used on this cart, an amount input and a "Use maximum" button. Typing more than the maximum is kept to the maximum. When the till is offline and the customer has points, show one short line saying points need a connection, and no input.
8. Reset the redeem store when the cart customer changes or is cleared (`ui/CustomerPanel.tsx`) and when the cart is cleared.
9. Show the server's refusals as clear messages: map the six `BONUS_...` codes to text where the till already turns checkout error codes into messages (find how `NO_OPEN_SHIFT` is handled and follow it).
10. A leftover from part 2, fix it here: `client/src/features/adjust-bonus/model/adjust-bonus.schema.ts` has English validation messages typed into the code. Make it `makeAdjustBonusSchema(t)` like `client/src/features/log-expense/model/expense-form.schema.ts`, with the messages as keys in `customers.json`, and update its spec and dialog.
11. Rules that bit earlier parts: the React Compiler is on, so read a form value with `useWatch`, never `form.watch`. Nothing new may be visible while bonus is off or no customer is chosen. Do not touch the credit sale flow (`features/pay-on-credit`): points are never used there.
12. Text: new keys go into `client/src/shared/i18n/en/pos.json` and the same keys with the same English text into `uz/pos.json` (and `customers.json` for item 10). Do not create a new i18n file. Do not write Uzbek. No raw key may show on screen.
13. Update `client/src/features/checkout/README.md` (it must stay ≤40 lines of new text: a short paragraph on points).

Checks. Run them and paste the real output:
```
cd client && pnpm install && pnpm test && pnpm lint && pnpm build
```
Then `graphify update .` in `client/` and at the repo root (if the command is missing, say so).

Commit on this branch, adding files by path (never `git add -A`). Do not edit `server/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/opencode/005-step11-pay-with-points.md`, set Status to done, and commit that too. Report only what you ran. You cannot open a browser, so say plainly that the screens were not seen; Claude checks them. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used:
- Commits:
- Files changed:
- `pnpm test`, `pnpm lint`, `pnpm build` output (last lines):
- Not done / skipped / failed:

## Check by Claude
