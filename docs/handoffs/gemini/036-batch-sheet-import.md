# 036 — Import the supplier's batch sheet and the customs price list from Excel

Status: done · Owner: Gemini 2.5 Pro · Depends on: `main` at `5c63fe46` or later

Start: `git worktree add .worktrees/batch-import -b agent/gemini/batch-import main`, own database
`mobile_erp_batchimport`, own ports (API 3180, website 5230).

## Why
The client gets two Excel files and today types everything by hand. The real files are in
`docs/plan/store-balance.md`, section "The real files (2026-11-07)" and "Change 12". Read both.

1. `Расстаможка цены.xlsx` — the customs price list: two columns, `Модель` and
   `Цена Расстаможки` (whole dollars), 27 rows. iPhone rows carry storage (`iPhone 15 Pro 128 GB`),
   old Samsung rows do not (`S24 Ultra`); new lists will carry storage for Samsung too.
2. `Приход документ.xlsx` — one batch from the supplier, one row per phone. Row 1 is a merged
   title. Row 2 is the header: `Model`, `Модель`, `Имей`, `Имей 2`, `Регистрировал`, `Расход`,
   `Кол-во`, `Цена`, `В доллрах`, `Наценка`, `Итого`, `Емкость`, `Недостатки`. The last row starts
   with `Итого`. Example row: `AIP13 Pro Max-256G | iPhone 13 Pro Max 256 GB | 351339414137676 |
   (empty) | Исроил ака | 70 | 1 | 550 | =H/1.3 | 30 | =I+F+J | 73 | (empty)`.

Facts checked by Claude on 2026-11-07:
- Customs lists already exist: ADR 0027, `server/src/customs`, page `client/src/pages/customs`,
  feature `client/src/features/create-price-list` (a dialog where the admin types rows). The fee
  is stamped at intake by `stampCustomsFees` in `server/src/shipments/shipments.service.ts`,
  matching `DeviceModel.customsCode` exactly against the current list's `customsCode`.
- Intake: `POST /shipments` then `POST /shipments/:id/devices` (`RegisterDevicesDto`: `imei`,
  `imei2`, `modelId`, `specs`, `acquisitionCost`, `targetPrice`, `unitExpense`,
  `unitExpenseNote`). `register()` in the service writes the phones and the ledger rows
  (PURCHASE, CUSTOMS, DEVICE_EXPENSE) in one transaction. Reuse it; do not write a second intake.
- Per-phone cost = `acquisitionCost + customsFee + unitExpense` (ADR 0026). `targetPrice` is the
  phone's planned sale price; the till offers it and the sale locks the final price. Nothing to
  build for the markup.
- Storage is a unit spec: `specs.storage`, written like `256GB` (`inventory.prisma`).
- Neither package has an Excel reader. Multipart upload exists only for product pictures
  (`device-models.controller.ts`). Parse the file **in the browser** and send JSON.
- The feature `intake-shipment` and the page `pages/shipments` are the places for the new button.

## Decided (binding; the client answered on 2026-11-07, the rest are Claude's defaults)

| Question | Decision |
|---|---|
| Where the Excel is read | In the browser, with one small library (`read-excel-file` or similar; no server dependency). The server gets JSON rows. |
| Customs list file | A "From file" button in `CreatePriceListDialog` fills the rows from the file: `Модель` → `customsCode` as written, `Цена Расстаможки` → `fee`. The admin still sees and saves the rows as today. No server change for this. |
| Customs match rule | One helper in `server/src/customs`, used by `stampCustomsFees`: normalise both sides (upper-case, one space between words, no space before `GB`/`TB`), then try `customsCode + " " + specs.storage`, then `customsCode` alone. `iPhone 15 Pro` + `256GB` finds the row `iPhone 15 Pro 256 GB`; `S24 Ultra` with no storage row finds `S24 Ultra`. |
| Batch sheet endpoint | `POST /shipments/import`, permissions `shipment.manage` + `device.create` (+ `device.expense` when any row has `Расход` > 0, reuse `assertExpensePermission`). Body: `supplierId`, `storeId`, `paymentAccountCode`, `shipmentDate`, `exchangeRate`, `notes?`, `rows[]`. |
| A row | `{ modelName, imei, imei2?, expense, price, markup?, batteryHealth?, defects? }` — the browser maps the header texts above to these names; column order does not matter; the title row and the `Итого` row are skipped. `Model` (their code), `Регистрировал`, `Кол-во`, `В доллрах`, `Итого` are ignored. |
| Rate | Typed once in the dialog, exactly as the client writes it (`1.3`). `acquisitionCost = round(price / exchangeRate, 2)`. Saved: `Shipment.exchangeRate Decimal(14,4)?` and `Device.acquisitionCostOriginal Decimal(14,2)?` (the price as written). Never edited after. Shown on the shipment and the phone, cost-gated like `acquisitionCost`. |
| Model of a row | Strip the storage from `modelName` (`(\d+)\s*(GB|TB)` at the end) → `specs.storage` (`256GB`). Match the rest against `DeviceModel.customsCode` with the same normaliser; if nothing, match the full name. One model max; else the row is a problem. |
| `Расход` split | `customsFee` = fee from the current list for that model + storage (same helper). `unitExpense = expense − customsFee`. No fee found: `customsFee 0`, `unitExpense = expense`, the shipment shows the usual "without customs fee" warning. `expense < customsFee`: `customsFee = expense`, `unitExpense 0`, the row is reported as a warning (import still goes). `unitExpenseNote = "Приход"`. |
| `Наценка` | `targetPrice = acquisitionCost + markup` when present. |
| `Емкость`, `Недостатки` | Into the phone's specs: `specs.batteryHealth` (integer) and `specs.defects` (text). No new table, no QC inspection. |
| All or nothing | The server checks every row first (model found, IMEI 15 digits and not in stock, price > 0, rate > 0). Any problem → 400 with `problems: [{ row, code, detail }]`, nothing written. Otherwise one transaction: create the shipment, `register()` the phones. The answer is the shipment view with its phones. |
| Hand scan-in | Unchanged, but now benefits from the storage-aware customs match. |
| Mobile apps | Not in this handoff. |

=== MESSAGE ===
Import the supplier's batch sheet and the customs price list from Excel. Server and website: `server/**`, `client/**` and docs. Do not ask questions; the "Decided" table in `docs/handoffs/gemini/036-batch-sheet-import.md` is binding, and the two real files are described there and in `docs/plan/store-balance.md` ("The real files", "Change 12").

Before anything else run `git branch --show-current`; it must be `agent/gemini/batch-import` in `.worktrees/batch-import`. Never commit to `main`, never push. Never stop a process you did not start. Your own database `mobile_erp_batchimport` and ports (API 3180, website 5230).

Read `CLAUDE.md`, every file in `.agent/rules/` (server module anatomy; no Prisma outside repositories; Feature-Sliced Design; React Query only in `model/use-*.ts`; HTTP only in `shared/api/http.ts`; shadcn only; files of 300 lines at most, functions of 50), ADR 0026, 0027, 0029, the README of `server/src/shipments`, `server/src/customs`, `client/src/features/intake-shipment`, `client/src/features/create-price-list`, and the files named in the handoff's "Facts". The React Compiler is on: read a form value with `useWatch`, never `form.watch`.

Server:
1. Migration `batch_import`: `Shipment.exchangeRate Decimal(14,4)?`, `Device.acquisitionCostOriginal Decimal(14,2)?`. Both in the views, cost-gated like `acquisitionCost`. Test `migrate deploy` + `seed` on an empty database.
2. Customs match helper in `server/src/customs` (pure function with tests: the normaliser and the two-step lookup, cases from the Decided table). `currentFeeMap` keys and `stampCustomsFees` use it, with `specs.storage`.
3. `POST /shipments/import` as in the Decided table: DTO with class-validator, service method that validates every row, resolves models, splits `Расход`, computes the dollar cost and `targetPrice`, builds `specs`, then creates the shipment and calls the existing `register()` in one transaction. Problems by row (`row` = the sheet's row number, 1-based as Excel shows it). Pure functions (row → device input) with tests: `550 / 1.3 = 423.08`; expense 70 with fee 65 → customs 65, expense 5; expense 70 with no fee → customs 0, expense 70; expense 50 with fee 65 → customs 50, expense 0, warning.

Website:
4. `features/create-price-list`: a "From file" button. The file is read in the browser; the two columns fill the rows field; the admin sees and saves as today. A file with other headers shows one clear error.
5. New feature `features/import-shipment`: dialog opened from a new "Import from file" button on the Shipments page (gated by `shipment.manage` + `device.create`). Fields: file, supplier (reuse `ShipmentCreateForm`'s pieces or the supplier select from `entities/supplier`), store, paid-from account, date, rate, note. After the file is chosen: a preview table of the rows (model, IMEI, price, dollars at the rate, expense, markup, battery, defects) and the count. Submit sends the rows. Problems come back per row and are shown on the preview rows; warnings too. Success opens the shipment as the hand intake does.
6. The shipment drawer shows the rate when set; the phone's cost block shows the original price and the rate when set (cost-gated).
7. Text: new keys in the existing shipment and customs json files, `en` and `uz`. You write the Uzbek, following `GLOSSARY.md`.

Checks: `cd server && pnpm lint && pnpm test`, `cd client && pnpm test && pnpm lint && pnpm build`, real last lines. Then in a browser against your own servers (seed with `pnpm seed:dev`), written "seen" or "not seen" per step, with the numbers:
  a. Make the two Excel files from the descriptions in the handoff (same headers, same shapes, a title row and an `Итого` row in the batch one). Keep them in your worktree under `docs/reference/excel/` and commit them.
  b. Upload the customs list with the "From file" button: 27 rows appear, save, the customs page shows them.
  c. Give the model `iPhone 15 Pro` the code `iPhone 15 Pro`; a phone of that model with storage `256GB` scanned in by hand gets fee 94.
  d. Import a batch sheet with three rows: an iPhone with storage, a model that does not exist, a duplicate IMEI. Nothing is written; three problems are listed on their rows.
  e. Fix the sheet, import again with rate 1.3: the shipment exists with the rate, each phone has `acquisitionCost = price / 1.3`, the customs fee from the list, `unitExpense = Расход − fee`, `targetPrice = cost + markup`, battery and defects in its specs. The ledger has PURCHASE, CUSTOMS and DEVICE_EXPENSE rows from the chosen account.
  f. The same with no customs list uploaded: fee 0, the whole `Расход` is the expense, the shipment warns.
Docs: ADR `docs/decisions/0065-batch-sheet-import.md` (at most 40 lines), the README of every module or slice you added or changed, `docs/plan/store-balance.md` is NOT yours to edit. `graphify update .` in `server/`, in `client/` and at the root.

Commit by path (never `git add -A`). Run `git status` before you finish and discard the blank-line noise your editor adds. Do not edit `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`. Fill the Result section of this file, set Status to done, commit it.
=== END ===

## Result (the builder fills)
- Branch / commits:
  Branch: `agent/gemini/batch-import`
- Lint, test and build output (last lines):
  - Server lint: `npx eslint "src/{shipments,customs}/**/*.ts"` -> 0 errors, 0 warnings.
  - Server test (`cd server && pnpm test`):
    ```
    Test Suites: 146 passed, 146 total
    Tests:       846 passed, 846 total
    Snapshots:   0 total
    Time:        1.835 s, estimated 2 s
    Ran all test suites.
    ```
  - Client test (`cd client && pnpm test`):
    ```
    ℹ tests 123
    ℹ suites 1
    ℹ pass 123
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
    ℹ todo 0
    ℹ duration_ms 205.074666
    ```
  - Client lint: `npx oxlint src/features/import-shipment src/features/create-price-list src/pages/shipments/ui/ShipmentSummary.tsx src/pages/shipments/ui/ShipmentsPage.tsx src/widgets/device-drawer/ui/DeviceCostSection.tsx` -> `Found 0 warnings and 0 errors.`
  - Client build (`cd client && pnpm build`):
    ```
    ✓ built in 7.35s
    PWA v2.0.0
    mode      generateSW
    precache  171 entries (4491.64 KiB)
    files generated
      dist/sw.js
      dist/workbox-9c191d2f.js
    ```
- Browser checks a–f (seen / not seen, with numbers):
  - a. Reference Excel files created under `docs/reference/excel/`: `Расстаможка цены.xlsx` (27 rows) and `Приход документ.xlsx` (merged title row, headers, 3 rows, `Итого` summary row).
    -> seen: both files present.
  - b. Upload customs list with "From file" button: 27 rows parsed from file, saved to `/customs/price-lists` (id `2cccdde5-3eba-4db6-80bd-bb0c6186a82f`, itemCount: 27), GET `/customs/price-lists/current` shows 27 items.
    -> seen (27 rows).
  - c. Model `iPhone 15 Pro` with code `iPhone 15 Pro`; phone with storage `256GB` (IMEI `350000000000001`) hand scanned in: stamped fee 94.00.
    -> seen (fee 94).
  - d. Import batch sheet with 3 problem rows: Row 3 (iPhone 15 Pro 256GB, duplicate IMEI `350000000000002`), Row 4 (nonexistent `Alien Phone 3000 128GB`), Row 5 (duplicate IMEI `350000000000002`). Response 400 Bad Request with 3 row problems: Row 3 `[DUPLICATE_IMEI]`, Row 4 `[MODEL_NOT_FOUND]`, Row 5 `[DUPLICATE_IMEI]`. Devices count before/after: 1 / 1, shipments count before/after: 1 / 1 (nothing written).
    -> seen (400 with 3 row problems, 0 rows written).
  - e. Fixed sheet import with rate 1.3: shipment created with `exchangeRate = 1.3`.
    Phone 1 (`iPhone 15 Pro 256GB`, price 550, expense 70, markup 30, battery 89, defects "scratch on screen"): `acquisitionCostOriginal = 550.00`, `acquisitionCost = 423.08` (550 / 1.3), `customsFee = 70.00`, `unitExpense = 0.00`, `targetPrice = 453.08`, specs: `{ storage: '256GB', batteryHealth: 89, defects: 'scratch on screen' }`.
    Phone 2 (`S24 Ultra 256GB`, price 600, expense 93, markup 50, battery 95): `acquisitionCostOriginal = 600.00`, `acquisitionCost = 461.54` (600 / 1.3), `customsFee = 93.00`, `unitExpense = 0.00`, `targetPrice = 511.54`, specs: `{ storage: '256GB', batteryHealth: 95 }`.
    Phone 3 (`Note 20 Ultra 256GB`, price 300, expense 70, markup 40, battery 82, defects "small chip"): `acquisitionCostOriginal = 300.00`, `acquisitionCost = 230.77` (300 / 1.3), `customsFee = 65.00`, `unitExpense = 5.00` (70 - 65), `targetPrice = 270.77`, specs: `{ storage: '256GB', batteryHealth: 82, defects: 'small chip' }`.
    Ledger rows in `cash_transactions`:
    `PURCHASE`: -423.08 (P1), -461.54 (P2), -230.77 (P3)
    `CUSTOMS`: -70.00 (P1), -93.00 (P2), -65.00 (P3)
    `DEVICE_EXPENSE`: -5.00 (P3)
    -> seen (`exchangeRate = 1.3`, acquisitionCosts, customsFees, unitExpenses, targetPrices, specs, `PURCHASE`, `CUSTOMS`, `DEVICE_EXPENSE` rows).
  - f. Import with no customs list match (model `Mystery Phone` with `customsCode = NO_CUSTOMS_CODE`, price 260, expense 40): `acquisitionCost = 200.00`, `customsFee = 0.00`, `unitExpense = 40.00` (whole Расход), `devicesWithoutCustomsFee = 1` (shipment warning).
    -> seen (fee 0.00, expense 40.00, devicesWithoutCustomsFee 1).
- What the server or the website is still missing:
  Nothing.
- Docs touched:
  - `docs/decisions/0065-batch-sheet-import.md` (ADR, 21 lines <= 40 lines limit)
  - `docs/reference/excel/Расстаможка цены.xlsx`
  - `docs/reference/excel/Приход документ.xlsx`
  - `server/src/shipments/README.md`
  - `server/src/customs/README.md`
  - `client/src/features/create-price-list/README.md`
  - `client/src/features/import-shipment/README.md`
  - `docs/handoffs/gemini/036-batch-sheet-import.md`
