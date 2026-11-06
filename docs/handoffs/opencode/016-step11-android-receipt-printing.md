# 016 — Step 11 on Android, part 3 of 4: points and printing on the receipt

Status: open · Owner: OpenCode · Depends on: 015 (committed on the same branch)

## Why
After a sale the phone must show what the website shows: the points spent and earned, the real
shop name on the receipt, and a Print button only when the shop switched receipt printing on,
at the paper width it chose (ADR 0043, 0047).

Facts checked by Claude on 2026-11-06:
- `GET /sales/:id` (`SaleView`) and `GET /sales/:id/receipt` (`ReceiptView`) both carry
  `bonus: { earned, spent }`, strings like `"1450.00"`, `"0.00"` when none. `ReceiptView` also
  carries `store: { name, address, phone }` (each may be null) and `footer` (may be null).
  Shapes: `server/src/sales/types/sale.types.ts`.
- `GET /reports/profit` carries the numbers `bonusPointsEarned` and `bonusPointsSpent`.
- The Android receipt prints the shop from two text keys typed for a demo (`pos.storeName`,
  `pos.storeLocation`) and always offers Print, on 58 mm paper (`lib/ReceiptPrinter.kt`).
- Part 1 put `receiptPrintingEnabled`, `receiptPaperWidthMm`, `storeName`, `storeAddress`,
  `storePhone`, `receiptFooter` in the till's `TillSettings`, cached for offline.
- Receipt printing is switched off by default on the server. So after this part a shop that
  never switched it on has no Print button on the phone, the same as on the website.

=== MESSAGE ===
Android app only: `mobile/android/**`. Show points on the receipt, the sale and the profit report, print the real shop name, and make printing follow the shop's printing settings. Do not ask questions.

Before anything else run `git branch --show-current` and `git status`. The branch must be `agent/opencode/step11-android`; if not, stop and say so. If `git status` shows uncommitted work from part 2, commit it first (files by path). Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` (binding). Then read `server/src/sales/types/sale.types.ts` (`SaleBonus`, `SaleView`, `ReceiptView`), `client/src/entities/sale/lib/receipt-bonus.ts`, and under `mobile/android/app/src/main/java/uz/malika/erp/features/sales/`: `data/SalesDtos.kt`, `data/PosModels.kt`, `data/SaleDomain.kt`, `model/PosReceiptBuilder.kt`, `ui/ReceiptContent.kt`, `lib/ReceiptPrinter.kt`, `ui/SaleDetailSheet.kt`. Paths below are in that `features/sales/` folder unless they start with `features/`.

1. Data.
   - `data/SalesDtos.kt`: new `SaleBonusDto(earned: String = "0", spent: String = "0")`; add `bonus: SaleBonusDto = SaleBonusDto()` to `SaleDto` and `ReceiptDto`; add to `ReceiptDto` `store: ReceiptStoreDto = ReceiptStoreDto()` (`name`, `address`, `phone`, all `String? = null`) and `footer: String? = null`. If the file would pass 250 lines, put the new classes in a new file `data/ReceiptDtos.kt` in the same package.
   - Carry `bonus` into the sale's domain type in `data/SaleDomain.kt`.
   - `data/PosModels.kt`, `ReceiptData`: add `storeName`, `storeAddress`, `storePhone`, `footer` (all `String? = null`), `pointsSpent: String? = null`, `pointsEarned: String? = null`. `ReceiptDto.toReceiptData()` fills them from the server; a points figure that is not above zero becomes null.

2. The receipt of a sale just made at the till (`model/PosReceiptBuilder.kt`, both builders): the shop fields and footer come from the till's `TillSettings`; `pointsSpent` is the points the cart used (null when none). `pointsEarned` stays null there: only the server knows it, and the sale's own receipt on the Sales screen shows it. Do not compute it on the phone.

3. One source for the shared lines. New file `lib/ReceiptRows.kt`, pure, no Compose:
   - `fun receiptHeaderLines(data: ReceiptData): List<String>`: `storeName`, `storeAddress`, `storePhone`, in that order, leaving out a null or blank one.
   - `fun receiptBonusRows(spent: String?, earned: String?, t: Translate): List<PrintRow>`: first `sales.paidWithPoints` with `"-" + formatPoints(spent)` when spent is above zero, then `sales.pointsEarned` with `formatPoints(earned)` when earned is above zero. Both absent → an empty list.
   - Test `ReceiptRowsTest.kt` (pass a `t` that returns the key). Points: none; spent only; earned only; both, in that order. Header: all three; name only; all null → empty.

4. `ui/ReceiptContent.kt` holds three outputs of one receipt. Change all three; stop using the demo keys `pos.storeName` and `pos.storeLocation` in this file.
   - `ReceiptPaper` (the paper on screen): the header is `receiptHeaderLines` (first line bold; no lines → nothing); the points rows after the payment lines; `footer` as the last line when it is not null or blank.
   - `buildReceiptText` (copy for Telegram): the first line is the shop name when there is one; the points lines after the total.
   - `printReceiptData` (the paper that is printed): the title is the shop name (empty when there is none), the address and phone go first in the header list. The printed rows today stop at the total: the screen also shows the trade-ins, the amount paid and the payment lines. Add those to the printed rows, same order and wording as on screen, then the points rows; add `footer` to the footer list when it is not null or blank.
   - A sale with no points prints the same lines as today, apart from the real shop name and the lines the print was missing.
   - The file is 132 lines; keep it under 250.

5. Printing follows the settings.
   - `lib/ReceiptPrinter.kt` `printReceipt` and `printReceiptData`: new parameter `paperWidthMm: Int`. Anything other than 80 is treated as 58. The page rule becomes `size: ${paperWidthMm}mm auto` and the body width `paperWidthMm - 4` mm. Leave the rest as it is.
   - Everywhere a receipt offers Print (find every caller of `printReceiptData`): the button exists only when `receiptPrintingEnabled` is true, and it passes `receiptPaperWidthMm`. Read both from the till settings (`PosRepository.tillSettings(online)`), so an offline phone uses the last known values. While they are not loaded: no Print button. Every other button on the receipt (share, copy, close) stays.

6. The sale's details. New file `ui/SaleBonusRows.kt`: two rows in the style of the rows around them, `sales.paidWithPoints` and `sales.pointsEarned`, each only when above zero, values through `formatPoints`. Mount it in `ui/SaleDetailSheet.kt` after the payments (one call; that file is 232 lines, do not grow it otherwise).

7. The profit report (`features/finance/`). `reports/profit` returns `ProfitReport` (see `data/FinanceApi.kt`): add to it `bonusPointsEarned: Double = 0.0` and `bonusPointsSpent: Double = 0.0`. In `ui/reports/OverviewTab.kt` show two more figures, `reports.pointsEarned` and `reports.pointsSpent`, in the style of the figures next to them, only when at least one of them is not zero. Plain numbers, no currency.

8. Nothing new shows for a sale without points. No new text keys are needed; if one truly is: same English text in `en` and `uz` under `client/src/shared/i18n/`, listed in the Result. Never write Uzbek.

Checks. Run them and paste the real last lines:
```
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
cd mobile/android && ./gradlew assembleDebug testDebugUnitTest
```
Then `graphify update .` in `mobile/android/` and at the repo root (if the command is missing, say so).

Commit on this branch, adding files by path (never `git add -A`). Do not stop before `git status` shows nothing to commit. Do not edit `server/**`, `client/src/**` outside `shared/i18n`, `mobile/ios/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/opencode/016-step11-android-receipt-printing.md`, set Status to done, and commit that too. Report only what you ran. You cannot see a phone screen or a print preview, so say plainly that neither was seen; Claude checks them. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used:
- Commits:
- Build and test output (last lines):
- Items 1 to 8, one line each:
- Every caller of `printReceiptData` and how each gets the two settings:
- Not done / skipped / failed:

## Check by Claude
