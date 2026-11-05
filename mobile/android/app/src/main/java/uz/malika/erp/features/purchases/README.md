# feature: purchases

Buying used phones from customers (Change 14, ADR 0039). A second way a unit
enters stock besides a supplier shipment. One route `purchases` (perm
`purchase.read`) in the More tab. Online only.

## Owns
- `data/` — `PurchaseApi` + `PurchaseRepository` (`/customer-purchases`),
  transport models (`CustomerPurchaseDto`, redaction-nullable `pricePaid`).
- `model/` — `PurchasesListViewModel` (date + exact IMEI/serial search),
  `BuyPhoneViewModel` (loads the sellable models, posts `POST /customer-purchases`),
  and `UsedUnitState` — the shared used-unit form state (model + specs +
  IMEI/serial), reused by the till's trade-in.
- `ui/` — `PurchasesScreen` (list + "Buy a phone"), `PurchaseDetailSheet`,
  `BuyPhoneSheet`, and `UsedUnitFields` — the model picker + spec fields +
  IMEI/serial scanner composable shared with `features/sales` trade-in.

## Public API (used by `features/sales` trade-in)
- `UsedUnitState` + `UsedUnitFields` — the used-unit form.

## Must never
- Store or ask for a passport / ID-document field — the seller is a customer
  (name + phone only), by design.
- Queue a purchase: it is always posted directly online (the server checks the
  shift and posts the money live).

## Depends on
- `features/inventory` for the models (`CatalogRepository`) and `DynamicSpecFields`.
- `features/sales` for the customer picker (mutual, like `sales`↔`credit`).
