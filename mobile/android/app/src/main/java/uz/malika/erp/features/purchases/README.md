# feature: purchases

Buying used phones from customers (Change 14, ADR 0039). A second way a unit
enters stock besides a supplier shipment. One route `purchases` (perm
`purchase.read`) in the More tab. Online only.

## Owns
- `data/` — `PurchaseApi` + `PurchaseRepository` (`/customer-purchases`),
  transport models (`CustomerPurchaseDto`, redaction-nullable `pricePaid`).
- `model/` — `PurchasesListViewModel`, `BuyPhoneViewModel` (sellable models,
  `POST /customer-purchases`), `UsedUnitState` (shared used-unit form state).
- `lib/` — `BuyError.kt` (buy failure keys by server code, ADR 0044).
- `ui/` — `PurchasesScreen`, `PurchaseDetailSheet`, `BuyPhoneSheet`,
  `UsedUnitFields` (shared with `features/sales` trade-in).

## Step 11 (ADR 0044/0060)
- A unit that is already ours and not SOLD is refused with the translated
  `purchases.buyNotSold` (code `PURCHASE_UNIT_EXISTS`); any other 409 keeps
  `purchases.buyConflict`; the shift gate (`NO_OPEN_SHIFT`) is unchanged.

## Public API (used by `features/sales` trade-in)
- `UsedUnitState` + `UsedUnitFields` — the used-unit form.
- `buyErrorKey(statusCode, code)` — pure, unit-tested.

## Must never
- Store or ask for a passport / ID-document field (name + phone only).
- Queue a purchase: always posted directly online.

## Depends on
- `features/inventory` (models), `features/sales` (customer picker).
