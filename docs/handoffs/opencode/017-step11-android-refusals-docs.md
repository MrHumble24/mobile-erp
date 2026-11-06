# 017 — Step 11 on Android, part 4 of 4: buy-back refusals and the docs

Status: open · Owner: OpenCode · Depends on: 016 (committed on the same branch)

## Why
The server now lets the shop buy back a phone it sold (ADR 0044), and refuses three things
with a stable `code`. The phone shows the server's English sentence, or one catch-all message
for every 409. This part shows the translated message for each code and writes down what the
four parts decided.

Facts checked by Claude on 2026-11-06:
- No Android check blocks a sold IMEI in "Buy a phone" or in a trade-in: the server decides.
- `POST /sales/:id/return` refuses with 409 `SALE_UNIT_BOUGHT_BACK` (the phone was bought back
  since) and 403 `TRADE_IN_REFUND_FORBIDDEN`. `POST /customer-purchases` refuses with 409
  `PURCHASE_UNIT_EXISTS` when the IMEI belongs to a unit that is not a sold one.
- `core/AppException.kt` already keeps the server's `code`.
- `features/purchases/model/BuyPhoneViewModel.kt` turns every 409 into `purchases.buyConflict`.
- The keys exist: `sales.returnBoughtBack`, `sales.returnTradeInForbidden`, `purchases.buyNotSold`.

=== MESSAGE ===
Android app only: `mobile/android/**`, plus docs. Show a clear translated message for three server refusals, then write the docs for step 11 on Android. Do not ask questions.

Before anything else run `git branch --show-current` and `git status`. The branch must be `agent/opencode/step11-android`; if not, stop and say so. If `git status` shows uncommitted work from part 3, commit it first (files by path). Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` (binding). Then read `docs/decisions/0044-buy-back-of-a-sold-unit.md`, `docs/decisions/0047-client-bonus-printing-buyback.md`, `client/src/features/warranty-lookup/lib/return-error.ts`, `client/src/features/buy-phone/lib/buy-error.ts`. Paths below are under `mobile/android/app/src/main/java/uz/malika/erp/`.

1. Returning a sale. New file `features/sales/lib/ReturnError.kt`: `fun returnErrorKey(code: String?): String?` with `SALE_UNIT_BOUGHT_BACK` → `sales.returnBoughtBack`, `TRADE_IN_REFUND_FORBIDDEN` → `sales.returnTradeInForbidden`, anything else → null. Where the return's failure is caught (follow `features/sales/ui/ReturnDialog.kt` to the code that catches the `AppException`), show `t(key)` when the function gives a key, else the server message as today. Test: both codes, an unknown code, null.

2. Buying a phone. In `features/purchases/model/BuyPhoneViewModel.kt` the order becomes: `NO_OPEN_SHIFT` as today; then code `PURCHASE_UNIT_EXISTS` → `errorKey = "purchases.buyNotSold"`; then any other 409 → `purchases.buyConflict` as today; then the server message. Put the choice in a pure function in a new file `features/purchases/lib/BuyError.kt` (`fun buyErrorKey(statusCode: Int, code: String?): String?`, the shift case stays in the view model) with a test: 409 with the code, 409 without, 400 → null.

3. The till. Part 2 already maps `PURCHASE_UNIT_EXISTS` and the `TRADE_IN_…` codes in `features/sales/lib/CheckoutError.kt`. Check that a trade-in failure in `TradeInCheckout` reaches the screen as that key. Change nothing if it does; say what you found.

4. Confirm by reading, and write the answer in the Result: is there any Android check that refuses an IMEI because the local list says it was sold, in `features/purchases/` or in the till's trade-in sheet? If you find one, remove it: the server decides.

5. Docs, in the same commits:
   - `docs/decisions/0060-step11-on-phones.md`, at most 40 lines, the usual ADR form (Date 2026-11-06, Status Accepted). Decisions to record: the phones follow the same switches as the website and show nothing new while a switch is off; points are shown as numbers, never money (`formatPoints`); the points plan sits on top of the trade-in plan, in cart order, same numbers as the website; a sale with points or a trade-in is posted directly and never queued; the receipt just made at the till shows points spent, and points earned only on the sale's own receipt; the shop name on the receipt comes from the server, the demo keys are no longer used; Print exists only while receipt printing is on, at 58 or 80 mm; refusals are mapped by code, per feature; price tags are not on the phones. Add one line saying iOS follows the same decisions (Gemini handoff 030).
   - `FOUNDATION.md` (the Android one): a short paragraph "Step 11" naming `shared/lib/Points.kt`, `features/sales/lib/BonusRedeem.kt`, `CheckoutError.kt`, and the rule "a new till flag goes into `PosState.cleared()`".
   - The READMEs of `features/sales`, `features/admin`, `features/purchases`, `features/finance`: a few lines each on what changed. Keep each at 40 lines or fewer; if one is already longer, do not make it longer, trim it.

6. Last look over all four parts: run `git diff main --stat` and list every Kotlin file over 250 lines that this branch touched, with its line count. None may be over 300.

Checks. Run them and paste the real last lines:
```
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
cd mobile/android && ./gradlew assembleDebug testDebugUnitTest
```
Then `graphify update .` in `mobile/android/` and at the repo root (if the command is missing, say so).

Commit on this branch, adding files by path (never `git add -A`). Do not stop before `git status` shows nothing to commit. Do not edit `server/**`, `client/src/**` outside `shared/i18n`, `mobile/ios/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/opencode/017-step11-android-refusals-docs.md`, set Status to done, and commit that too. Report only what you ran. You cannot see a phone screen, so say plainly that the screens were not seen; Claude checks them. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used:
- Commits:
- Build and test output (last lines):
- Items 1 to 6, one line each:
- Files over 250 lines touched by the branch:
- Not done / skipped / failed:

## Check by Claude
