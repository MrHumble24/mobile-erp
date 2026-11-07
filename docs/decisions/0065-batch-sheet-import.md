# 0065 — Supplier Batch Sheet and Customs Price List Import from Excel

Date: 2026-11-07
Status: Accepted

## Context
Supplier shipments arrive with batch sheets (`Приход документ.xlsx`) in foreign currency (e.g. KRW/USD) and customs price lists (`Расстаможка цены.xlsx`) in Excel format. Intake required manual row-by-row re-entry, risking calculation errors on exchange rate conversion, expense splitting, and customs matching.

## Decision
- **Excel Parsing in Browser**: Uses `read-excel-file/universal` in client slices `create-price-list` and `import-shipment`. Zero Excel parsing logic or large dependencies on the server.
- **Customs Lookup**: Normalized two-step lookup (`customsCode + storage` then fallback `customsCode`) with uppercase, whitespace, and storage token canonicalization.
- **Atomic Transactional Import (`POST /shipments/import`)**: Validates entire sheet, checks model names/customs codes, unique IMEIs, and required storage specs. If any row fails, rejects whole request with 400 and structured row-level problems.
- **Cost Calculation**: Converts original price to USD via `price / exchangeRate` (rounded to 2 decimal places). Calculates `customsFee = min(expense, fee)` and `unitExpense = expense - customsFee`. Computes `targetPrice = acquisitionCost + markup`.
- **Ledger Integration**: Reuses existing `register()` transactional logic, posting `PURCHASE`, `CUSTOMS`, and `DEVICE_EXPENSE` (when > 0) to `cash_transactions` from the shipment account.
- **Schema & Permissions**: Added `Shipment.exchangeRate Decimal(14,4)?` and `Device.acquisitionCostOriginal Decimal(14,2)?`, both redacted under cost permission gates.
- **UI & UX**: Added "From file" button to customs price list and "Import from file" modal to Shipments page with preview table, row-level problem/warning badges, and Uzbek/English localization.

## Consequences
- The `reference_catalog` migration shipped alongside creates the two lookup tables that `reference.prisma` had without a migration (`IF NOT EXISTS`: live databases got them by `db push`).
- `docs/reference/excel/Расстаможка цены.xlsx` is the client's real list; the batch sheet there is a synthetic copy of the real one's shape (the real one holds a person's name and a live IMEI).
- Eliminates manual data entry errors and automates landed cost math.
- Guarantees all-or-nothing atomicity so invalid sheets never produce partial shipments.
- Strict adherence to module anatomy, FSD, file size (<= 300 lines) and function size (<= 50 lines).
