# 015 — Step 11 on Android, part 2 of 4: paying with points at the till

Status: open · Owner: OpenCode · Depends on: 014 (committed on the same branch)

## Why
The server accepts `bonusRedeem` on `POST /sales` (ADR 0043). The till sends one sale per cart
line, so the points a customer spends on a cart are shared out over its lines, the way trade-ins
already are. This is money logic: the rules and the test numbers are given exactly. They are
the same numbers the website passed (`client/src/features/checkout/lib/bonus-redeem.ts`).

Facts checked by Claude on 2026-11-06:
- A sale with points is refused on the offline replay (`BONUS_REDEEM_OFFLINE`), so it must be
  posted directly, like a cart with trade-ins (`model/PosTradeIn.kt`, `model/TradeInCheckout.kt`).
- `PosViewModel.kt` is 269 lines, `PosScreen.kt` 272, `SaleCreate.kt` 226.
- `PosViewModel.checkout`, `resetCart` and `finishTradeIn` each rebuild `PosState` by listing the
  flags to keep by hand. `checkout` forgets `canTradeIn` today. Item 1 fixes that for good.

=== MESSAGE ===
Android app only: `mobile/android/**`. Let a customer pay part of a sale with bonus points at the till. Do not ask questions.

Before anything else run `git branch --show-current` and `git status`. The branch must be `agent/opencode/step11-android`; if not, stop and say so. If `git status` shows uncommitted work from part 1, commit it first (files by path). Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` (binding). Then read `docs/decisions/0043-bonus-points.md`, `client/src/features/checkout/lib/bonus-redeem.ts`, and under `mobile/android/app/src/main/java/uz/malika/erp/features/sales/`: `lib/TradeInPlan.kt`, `model/TradeInCheckout.kt`, `model/PosTradeIn.kt`, `model/PosState.kt`, `model/PosViewModel.kt`, `data/SaleCreate.kt`, `ui/PosCheckoutForm.kt`. All paths below are in that `features/sales/` folder.

How the server decides, per sale (one cart line is one sale). `bonusRedeem` must not be more than: the customer's balance; `maxRedeemPercent` of that sale's price, rounded to 2 decimals half up; what is left to pay on that sale (its price minus the trade-ins on it). Cash and card for that sale must add up to price − trade-ins − `bonusRedeem`.

1. One way to empty the cart. In `model/PosState.kt` add `fun PosState.cleared(completed: ReceiptData? = null): PosState` that returns a fresh `PosState` keeping every flag and setting (`pendingSold`, `defaultWarrantyDays`, `settings`, `canOverride`, `canUnlimited`, `creditEnabled`, `shiftsEnabled`, `canTradeIn`, and the new fields of item 4 that are settings) and dropping the cart, the trade-ins, the points and the customer's bonus. Use it in `PosViewModel.checkout`, `PosViewModel.resetCart` and `finishTradeIn`. This makes `PosViewModel.kt` shorter; it must not get longer in this part.

2. `lib/BonusRedeem.kt`, pure, all sums in `Long` cents like `TradeInPlan`:
   ```kotlin
   object BonusRedeem {
       data class Line(val lineId: String, val priceCents: Long, val dueCents: Long) // due = price minus its trade-ins
       data class Plan(
           val maxCents: Long,                          // the most the customer may spend on this cart
           val totalCents: Long,                        // what will be spent: requested, kept between 0 and max
           val byLine: Map<String, Long>,               // lineId -> points on that line (only lines with points)
           val payableLines: List<TradeInPlan.AllocLine>, // per line: due minus its points
       )
       fun plan(lines: List<Line>, requestedCents: Long, balanceCents: Long, maxPercent: BigDecimal): Plan
   }
   ```
   A line's cap is the smaller of (price × maxPercent ÷ 100, rounded to a cent half up) and its due. `max` is the smaller of the balance and the sum of the caps. A negative request, balance or percent counts as 0. `total` is the request kept between 0 and `max`. Share `total` out in cart order: each line takes as much as its cap allows until nothing is left.

3. `BonusRedeemTest.kt` next to `TradeInPlanTest.kt`, exactly these cases (amounts in money, convert to cents):
   - one line, price 100000, due 100000; balance 5000; max 50; requested 5000 → max 5000, total 5000, byLine 5000, payable 95000.
   - one line 100000; balance 200000; max 50; requested 80000 → max 50000, total 50000.
   - two lines, 100000 and 40000 (due the same); balance 60000; max 50; requested 60000 → byLine 50000 and 10000; payable 50000 and 30000.
   - one line, price 100000, due 30000; balance 90000; max 50; requested 90000 → max 30000, total 30000, payable 0.
   - balance 0 → max 0, total 0, payable equals due. The same with max percent 0.
   - one line, price 333.33; balance 1000; max 50; requested 1000 → max 166.67.
   - requested −5 → total 0.

4. State. In `model/PosState.kt` add `bonusEnabled: Boolean = false` (a setting, from `TillSettings`, set where `creditEnabled` is set), `customerBonus: CustomerBonus? = null` (`CustomerBonus(customerId: String, balance: BigDecimal, maxPercent: BigDecimal)`), `bonusRequested: BigDecimal = BigDecimal.ZERO`, and a computed `bonusPlan` built from `priced.lines` (price) and `tradeInPlan.payableLines` (due). Change `amountToPay` to the sum of `bonusPlan.payableLines`. When there is no `customerBonus`, the plan must give max 0 and the amount to pay must equal today's.

5. New file `model/PosBonus.kt`, extension functions on `PosViewModel` in the style of `PosTradeIn.kt`:
   - `loadCustomerBonus(customerId: String?, online: Boolean)`: with no id, offline, or bonus off → clears `customerBonus` and `bonusRequested`. Otherwise `GET customers/{id}/bonus` through the repository (add `customerBonus(id)` to `data/PosRepository.kt`, calling the API method part 1 added); when the answer says `enabled`, store the balance and `maxRedeemPercent`; on any failure clear both. Call it from the UI whenever the chosen customer changes or is cleared.
   - `setBonusRequested(amount: BigDecimal)`: stores the amount kept between 0 and the plan's max.
   - `checkoutDirect(...)`: replaces `checkoutWithTradeIns` as the one direct online path, used when the cart has trade-ins or points. Same guards as today, plus: with points a picked customer id is required. Same partial-failure rule: committed lines and their trade-ins are dropped, and `bonusRequested` is lowered by the points of the committed lines, so a retry never spends points twice.

6. `model/TradeInCheckout.kt` `run`: one more parameter `bonusByLine: Map<String, Long> = emptyMap()`. The tender is split over each line's price minus its trade-ins minus its points, and each line's payload carries its points. On a failure the result's `error` is `checkoutErrorKey(e.code)` (item 8) when that is not null, else the server message as today.

7. `data/SaleCreate.kt`: `payload` and `quantityPayload` get `bonusRedeem: BigDecimal? = null`; it is put in the body as the number `bonusRedeem` only when above zero. Test it (in `app/src/test/java/uz/malika/erp/features/sales/SalesLogicTest.kt` if that file already tests `SaleCreate`, else a new `SaleCreateTest.kt` next to it): present when 5000, absent when null and when zero. `SaleCreate.ops` (the queued path) never sends it.

8. New file `lib/CheckoutError.kt`: `fun checkoutErrorKey(code: String?): String?` with exactly: `BONUS_DISABLED` → `pos.bonusErrorDisabled`, `BONUS_NO_CUSTOMER` → `pos.bonusErrorNoCustomer`, `BONUS_REDEEM_EXCEEDS_BALANCE` → `pos.bonusErrorExceedsBalance`, `BONUS_REDEEM_EXCEEDS_MAX` → `pos.bonusErrorExceedsMax`, `BONUS_REDEEM_EXCEEDS_DUE` → `pos.bonusErrorExceedsDue`, `BONUS_REDEEM_OFFLINE` → `pos.bonusErrorOffline`, `TRADE_IN_FORBIDDEN` → `pos.tradeInErrorForbidden`, `TRADE_IN_NO_CUSTOMER` → `pos.tradeInErrorNoCustomer`, `TRADE_IN_OFFLINE` → `pos.tradeInErrorOffline`, `TRADE_IN_EXCEEDS_SALE` → `pos.tradeInErrorExceedsSale`, `PURCHASE_UNIT_EXISTS` → `purchases.buyNotSold`; anything else → null. A test with one known code, one unknown, and null.

9. Screen. New file `ui/BonusRedeemControl.kt`, mounted in `ui/PosCheckoutForm.kt` above the payment fields:
   - shown only when the plan's max is above 0: `pos.bonusBalance` with the balance, `pos.bonusMax` with the max (both through `formatPoints`), a number field `pos.bonusAmount`, a button `pos.bonusUseMax`. Typing more than the max is kept to the max.
   - offline, with a chosen customer whose last looked-up `bonusBalance` is above 0: one line `pos.bonusOffline`, no field.
   - In `PosCheckoutForm.kt`: `total` is `state.amountToPay` whenever there are trade-ins or points; the totals show a row `pos.bonusPoints` with a minus sign when points are used; the pay button calls `checkoutDirect` when there are trade-ins or points, else `checkout` as today. `PosCheckoutForm.kt` is 163 lines: keep it under 250, moving rows into the new file if needed.
   - Points are never offered on the "On credit" path. Do not touch `features/credit`.

10. Nothing new is visible while bonus is off or no customer is chosen, and the queued offline sale works exactly as before.

11. No new text keys are needed (`pos.bonus…` exist). If one truly is: same English text in `client/src/shared/i18n/en/pos.json` and `uz/pos.json`, listed in the Result. Never write Uzbek.

Checks. Run them and paste the real last lines:
```
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
cd mobile/android && ./gradlew assembleDebug testDebugUnitTest
```
Then `graphify update .` in `mobile/android/` and at the repo root (if the command is missing, say so).

Commit on this branch, adding files by path (never `git add -A`). Do not stop before `git status` shows nothing to commit. Do not edit `server/**`, `client/src/**` outside `shared/i18n`, `mobile/ios/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/opencode/015-step11-android-pay-with-points.md`, set Status to done, and commit that too. Report only what you ran. You cannot see a phone screen, so say plainly that the screens were not seen; Claude checks them. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used:
- Commits:
- Build and test output (last lines):
- Items 1 to 11, one line each:
- Line counts of `PosViewModel.kt`, `PosCheckoutForm.kt`, `SaleCreate.kt` after the change:
- Not done / skipped / failed:

## Check by Claude
