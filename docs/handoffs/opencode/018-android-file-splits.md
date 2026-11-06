# 018 — Android: split three files that sit at the size limit

Status: open · Owner: OpenCode · Depends on: nothing

## Why
The project's rule is 300 lines per source file, and "approaching 250, split now". After step 11
three Android files are close to the wall, and the next feature on the till would be refused:
`PosScreen.kt` 278 lines, `PosViewModel.kt` 276, `DeviceSheet.kt` 275. This is a tidy-up with no
change in behaviour: code moves to new files, nothing else.

Facts checked by Claude on 2026-11-07:
- `PosViewModel` already has two files of extension functions built this way: `model/PosTradeIn.kt`
  and `model/PosBonus.kt`. `_state` is `internal`, so an extension in the same module can use it.
- `PosScreen.kt` holds two components: `PosScreen` and the private `PosReceiptSheet`.
- `DeviceSheet.kt` holds `DeviceSheet`, `DeviceSheetBody` and two small private helpers,
  `SectionTitle` and `ImeiCopyRow`. `DeviceSheetSections.kt` next to it is 209 lines, so it stays under 250 with the two helpers.
- Gemini is working on the server and the website (factory reset). Nobody else touches Android.

=== MESSAGE ===
Android app only: `mobile/android/**`. Split three files that are close to the 300-line limit. Move code, change nothing else. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/opencode/android-splits`, stop and say so. Work only in this folder. Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` first, then `mobile/android/app/src/main/java/uz/malika/erp/FOUNDATION.md`. Paths below are under `mobile/android/app/src/main/java/uz/malika/erp/features/`.

The one rule of this task: behaviour must not change. Do not rename a function, do not change a parameter, do not change a line of logic, do not "improve" anything you move. A reviewer must be able to see that each new file holds exactly the lines that left the old one.

1. `sales/model/PosViewModel.kt` (276 lines). Move the functions that edit a cart line or its pricing into a new file `sales/model/PosCartEdits.kt`, as extension functions on `PosViewModel`, written the way `sales/model/PosBonus.kt` is: `setLinePrice`, `setLineWarranty`, `setLineQuantity`, `setLineDiscount`, `setCartDiscount`, `setLevel`, `applyCustomer`, `toggleOverride`, `removeLine`, and their private helper `mapLine`. Keep their doc comments. Then add the imports the callers now need (search the `sales/ui/` folder for each name; a method reference like `vm::setCartDiscount` needs the import too). `PosViewModel.kt` must end at 220 lines or fewer.

2. `sales/ui/PosScreen.kt` (278 lines). Move `PosReceiptSheet` into its own file `sales/ui/PosReceiptSheet.kt` (one component per file), `internal` instead of `private`. `PosScreen.kt` must end at 250 lines or fewer.

3. `inventory/ui/DeviceSheet.kt` (275 lines). Move `SectionTitle` and `ImeiCopyRow` into `inventory/ui/DeviceSheetSections.kt`, `internal` instead of `private`. If a helper with the same name already exists in that package, keep one and say which. `DeviceSheet.kt` must end at 250 lines or fewer.

4. Remove imports that a file no longer uses after its code left. Add nothing else.

Checks. Run them and paste the real last lines:
```
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
cd mobile/android && ./gradlew assembleDebug testDebugUnitTest
```
Then `wc -l` of the six files (three old, three new or grown), and `graphify update .` in `mobile/android/` and at the repo root (if the command is missing, say so).

Commit on this branch, one commit per numbered item, adding files by path (never `git add -A`). Do not stop before `git status` shows nothing to commit. Do not edit `server/**`, `client/**`, `mobile/ios/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/opencode/018-android-file-splits.md`, set Status to done, and commit that too. Report only what you ran. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used:
- Commits:
- Build and test output (last lines):
- Line counts of the six files:
- Anything that was not a pure move, and why:
- Not done / skipped / failed:

## Check by Claude
