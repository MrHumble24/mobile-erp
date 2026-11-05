# pricing

Price levels and discount math for the till (Change 12/7, ADR 0034).

## Owns

- The `LevelCode`/`LevelPrices`/`Discount` domain types and the `/pricing`
  repository (`levels`, product prices, unit prices).
- `lib/discount.ts` — the pure checkout money rules in integer cents, mirrored
  from the server's `checkout-pricing.ts`: `levelPriceCents`, `discountAmountCents`,
  `finalPriceCents`, `discountCapPercent`, `discountError`. Unit-tested in
  `discount.spec.ts`.

## Exposes (public API)

- `usePriceLevels()` — the level picker options.
- `useProductPrices(modelId)` / `useSetProductPrices(modelId)` — the storage×level grid.
- `useUnitPrices(deviceId)` / `useSetUnitPrices(deviceId)` — a unit's own prices.
- The `discount` helpers and types above.

## Must never

- Import a sibling entity. Cross-entity cache invalidation after a price change
  happens in the `set-prices` feature, which may import both.
- Do money arithmetic in floats — always cents, rounded half-up like the server.
