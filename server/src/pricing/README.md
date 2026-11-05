# pricing

Price levels and list-price resolution (Change 12/7, ADR 0034). Owns
`price_levels`, `product_prices`, `unit_prices`. The single answer to "what does
this unit/product cost at level X" and the owner's price-manage screen.

## Price model (no drift)

- A unit's **RETAIL** own price is `Device.targetPrice`; a quantity product's
  **RETAIL** price is `DeviceModel.salePrice` — neither is copied here.
- `unit_prices(deviceId, levelCode)` holds a unit's WHOLESALE/PARTNER own prices.
- `product_prices(modelId, storage, levelCode)` holds product prices per storage
  (storage `""` = any) for WHOLESALE/PARTNER and a phone's per-storage RETAIL.
- Resolution order (`lib/price-resolution.ts`, pure): unit own → product price
  for the storage → product price for any storage → none.

## Exposes (REST `/pricing`)

- `GET /levels` — any signed-in user → active `{ code, label }[]` for the picker.
- `GET /products/:modelId` (`price.manage`) → `{ modelId, kindCode, prices:
  [{ storage|null, levelCode, price }] }` (RETAIL `""` folded from `salePrice`).
- `PUT /products/:modelId` (`price.manage`) `{ prices:[{ storage?:string|null,
  levelCode, price:number|null }] }` — set all in one call; `price:null` clears;
  RETAIL at any-storage writes `salePrice`.
- `GET /units/:deviceId` (`price.manage`) → `{ deviceId, prices:[{ levelCode,
  price }] }` (RETAIL = targetPrice).
- `PUT /units/:deviceId` (`price.manage`) `{ prices:[{ levelCode,
  price:number|null }] }` — RETAIL writes `targetPrice`.

## Public API (DI)

`PricingService`: `getActiveLevels`, `assertLevel`, `listPriceForUnit`,
`listPriceForProduct`, `pricesForUnits`, `pricesForProducts` (batch resolve for
read enrichment), plus the CRUD above. Checkout money/discount rules live in
`lib/checkout-pricing.ts` (pure) and are driven by sales, not here.

## Must never

- Store a second copy of the retail price. Let another module inject the
  repository — inject `PricingService`.
