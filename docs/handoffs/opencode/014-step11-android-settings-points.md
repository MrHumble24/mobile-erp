# 014 — Step 11 on Android, part 1 of 4: the switches and a customer's points

Status: open · Owner: OpenCode · Depends on: nothing

## Why
Step 11 (bonus points, printing switches, buying back a sold phone) is on the server and the
website (ADR 0043, 0044, 0047). The phone apps have none of it. Android goes to OpenCode in four
parts, all in ONE worktree and branch, pasted in order: 014 switches and a customer's points,
015 paying with points at the till, 016 points and printing on the receipt, 017 refusal messages
and docs. iOS is Gemini's (`docs/handoffs/gemini/030`); the two never touch the same file.

Facts checked by Claude on 2026-11-06 (read the files, do not re-derive):
- `GET /settings` (any signed-in user) returns `bonusEnabled`, `bonusEarnPercent`,
  `bonusMaxRedeemPercent`, `receiptPrintingEnabled`, `receiptPaperWidthMm` (58 or 80),
  `priceTagsEnabled`, next to `storeName`, `storeAddress`, `storePhone`, `receiptFooter`.
  `PUT /settings` (`settings.manage`) takes the two percents as numbers 0 to 100 with at most
  2 decimals, the width as 58 or 80.
- `GET /customers/lookup` gives every match a `bonusBalance`: a string like `"1450.00"` while
  bonus is on, `null` while it is off.
- `GET /customers/:id/bonus` (`customer.read`) returns `BonusView`
  (`server/src/bonus/types/bonus.types.ts`). `POST /customers/:id/bonus/adjustments`
  (`bonus.adjust`) takes `{ amount, reason }` and returns the new `BonusView`.
- Every text key already exists: `settings.sectionBonus…priceTagsEnabled`, `customers.bonus…`.
  Both apps read `client/src/shared/i18n` directly.
- One point = one unit of money, but points are not money: show them as a plain number.

=== MESSAGE ===
Android app only: `mobile/android/**`. Add the step 11 switches to the settings screen and show a customer's bonus points. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/opencode/step11-android`, stop and say so. Work only in this folder. Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` first (files of 300 lines at most, one job per file, no new dependency). Then read `mobile/android/app/src/main/java/uz/malika/erp/FOUNDATION.md`, `docs/decisions/0043-bonus-points.md`, `server/src/bonus/types/bonus.types.ts` and `server/src/bonus/dto/adjust-bonus.dto.ts`. All paths below are under `mobile/android/app/src/main/java/uz/malika/erp/`. Use the shared kit in `shared/ui/` only, and build each new piece the way the file next to it is built.

1. Points as text. New file `shared/lib/Points.kt`: `fun formatPoints(value: String?): String`. Groups thousands the way `formatMoney` in `shared/lib/Money.kt` does, never a currency, drops a `.00` ending, keeps other decimals: `"1450.00"` → `1 450`, `"12.50"` → `12.5`, `"-300.00"` → `-300`, `null` or junk → `0`. Test `PointsTest.kt` under `app/src/test/java/uz/malika/erp/shared/lib/` with exactly those four cases (match the group separator `formatMoney` uses).

2. Settings screen (`features/admin/`).
   - `data/AdminModels.kt`, `StoreSettingsDto`: add `bonusEnabled: Boolean = false`, `bonusEarnPercent: JsonElement? = null`, `bonusMaxRedeemPercent: JsonElement? = null` (read them the way `maxDiscountPercent` is read), `receiptPrintingEnabled: Boolean = false`, `receiptPaperWidthMm: Int = 80`, `priceTagsEnabled: Boolean = false`.
   - Carry the six values through the form, the view model and `model/SettingsValidation.kt` the way `shiftsEnabled` and `maxDiscountPercent` are carried. A percent must be a number from 0 to 100 with at most 2 decimals; it is checked only while `bonusEnabled` is on.
   - `data/SettingsRepository.kt` `update`: send all six in the `PUT` body. Percents as numbers, the width as the number 58 or 80.
   - `ui/SettingsSections.kt` is 179 lines: do not grow it. New file `ui/SettingsBonusPrintingSections.kt` with two sections, built like the shifts and customer-credit sections. Bonus: the switch `settings.bonusEnabled`, and only while it is on the two fields `settings.bonusEarnPercent` and `settings.bonusMaxRedeemPercent`. Printing: the switch `settings.receiptPrintingEnabled`, a choice of `settings.paperWidth58` or `settings.paperWidth80` under the label `settings.receiptPaperWidth`, the switch `settings.priceTagsEnabled`. Section titles: `settings.sectionBonus`, `settings.sectionPrinting`. Mount both in `ui/SettingsScreen.kt` after the last section there.

3. The till's copy of the settings (`features/sales/`). `data/SalesDtos.kt` is 245 lines: move `SettingsDto` out of it into a new file `data/SettingsDto.kt` (same package, so no import changes) and add there: `bonusEnabled`, `receiptPrintingEnabled`, `receiptPaperWidthMm: Int = 80`, `storeName: String? = null`, `storeAddress: String? = null`, `storePhone: String? = null`, `receiptFooter: String? = null`. In `data/PosRepository.kt` add the same seven to `TillSettings` and to `toTillSettings()`. They ride the existing cache, so an offline till keeps the last known values. Nothing reads them yet; parts 2 and 3 do.

4. Points next to a customer's name. `data/CustomerDtos.kt`, `CustomerDto`: add `bonusBalance: String? = null`. Carry it into the domain type in `data/CustomerDomain.kt`. In `ui/CustomerPicker.kt`, when it is not null, show `t("customers.bonusPickerPoints", mapOf("points" to formatPoints(balance)))` after the name in the muted style. When it is null, the row looks exactly as today.

5. A customer's points on the detail sheet.
   - `data/SalesApi.kt`: `@GET("customers/{id}/bonus") suspend fun customerBonus(@Path("id") id: String): CustomerBonusDto` and `@POST("customers/{id}/bonus/adjustments") suspend fun adjustCustomerBonus(@Path("id") id: String, @Body body: AdjustBonusBody): CustomerBonusDto`.
   - New file `data/BonusDtos.kt`: `CustomerBonusDto(customerId, enabled, earnPercent, maxRedeemPercent, balance, history)`, `BonusHistoryRowDto(id, typeCode, amount, occurredAt, note, saleId, createdBy)` with `createdBy` an optional `{ id, name }`, and `AdjustBonusBody(amount: Double, reason: String)`. Strings for the amounts, exactly as the server sends them; give every field a default.
   - `data/CustomersRepository.kt`: `bonus(id)` and `adjustBonus(id, amount, reason)`, both through `runApi`.
   - New file `model/CustomerBonusViewModel.kt`: loads the bonus of one customer; state = loading, the DTO, or an error message; `adjust(amount, reason)` posts, then puts the answer in the state.
   - New file `ui/CustomerBonusSection.kt`, mounted in `ui/CustomerDetailSheet.kt` (one call, do not grow that file otherwise). It shows nothing at all while loading fails, while offline, or while the answer has `enabled == false`. Otherwise: the title `customers.bonusTitle`, `customers.bonusBalance` with `formatPoints(balance)`, then `customers.bonusHistory`: per row the type (`EARN` → `customers.bonusTypeEarn`, `SPEND` → `bonusTypeSpend`, `RETURN` → `bonusTypeReturn`, `CORRECTION` → `bonusTypeCorrection`, anything else: the code itself), the amount with its sign (`+` in front of a positive one), the date, the note when present, and `customers.bonusBy` with the name when present. No rows: `customers.bonusEmptyHistory`.
   - New file `ui/AdjustBonusSheet.kt`, opened by a `customers.bonusCorrect` button that exists only for a user with the permission `bonus.adjust` (check it the way `ui/PosScreen.kt` checks `purchase.create`) and only while online. Title `customers.bonusAdjustTitle`, hint `customers.bonusAdjustHint`, a field `customers.bonusAmount` (a minus sign is allowed), a field `customers.bonusReason`, the button `customers.bonusApply`. Success: toast `customers.bonusAdjusted`, close, the section shows the new balance and row. A server refusal shows its message in the sheet.
   - The checks of that sheet go in a pure function in a new file `lib/AdjustBonus.kt`: `fun adjustBonusError(amount: String, reason: String): String?` returning the first failing key or null: empty amount → `customers.bonusErrAmountRequired`; not a number or more than 2 decimals → `customers.bonusErrAmountFormat`; zero → `customers.bonusErrAmountZero`; blank reason → `customers.bonusErrReasonRequired`; reason over 500 characters → `customers.bonusErrReasonTooLong`. Test `AdjustBonusTest.kt` under `app/src/test/java/uz/malika/erp/features/sales/lib/`: one case per key, plus `"-50"` with a reason → null and `"100.25"` with a reason → null.

6. Nothing new may be visible while bonus is off: no points in the picker (the server sends null), no section on the customer. The two settings sections are always visible to a user who can open settings.

7. No new text keys are needed. If one truly is, add it with the same English text to both `client/src/shared/i18n/en/<file>.json` and `uz/<file>.json` and list it in the Result. Never write Uzbek.

Checks. Run them and paste the real last lines:
```
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
cd mobile/android && ./gradlew assembleDebug testDebugUnitTest
```
Then `graphify update .` in `mobile/android/` and at the repo root (if the command is missing, say so).

Commit on this branch, adding files by path (never `git add -A`). Do not stop before `git status` shows nothing to commit. Do not edit `server/**`, `client/src/**` outside `shared/i18n`, `mobile/ios/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/opencode/014-step11-android-settings-points.md`, set Status to done, and commit that too. Report only what you ran. You cannot see a phone screen, so say plainly that the screens were not seen; Claude checks them. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used:
- Commits:
- Build and test output (last lines):
- Items 1 to 7, one line each:
- New text keys (should be none):
- Not done / skipped / failed:

## Check by Claude
