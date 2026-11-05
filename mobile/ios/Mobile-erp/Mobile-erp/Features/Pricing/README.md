# Pricing (slice)

Price levels, the owner's price-manage screens and the till's discount math
(Change 12/7, ADR 0034). A support slice — no `FeatureModule`, no nav entry;
other slices embed its sheets and reuse its pure math.

## Owns / exposes

- `PriceLevels` + `PriceLevelPrices` (`Lib/`): the three level codes
  (`RETAIL`/`WHOLESALE`/`PARTNER`) and the resolved-prices value type decoded
  everywhere a read carries `prices` (catalog, scan, stock, device detail, the
  sync feed, the offline cache).
- `PricingMath` (`Lib/`): pure, `Decimal`-only discount + spread arithmetic that
  mirrors the server's `checkout-pricing.ts` so the till stops the seller before
  the API does and the `salePrice` it sends matches the server. Half-up to 2 dp.
  A DEBUG `PricingSelfCheck` covers price-per-level, percent/amount discounts,
  the cashier cap + standing discount, and an exact cart-discount spread.
- `PricingRepository` + DTOs (`Data/`): `GET /pricing/levels`,
  `GET|PUT /pricing/{products,units}/:id` (`price.manage`). Writes send
  `price: null` to clear via the explicit-null JSON body.
- Editor sheets (`UI/`): `PricingProductSheet` (storage × level, opened from the
  product form), `PricingUnitSheet` (a unit's own prices, opened from the device
  sheet), both built on `PricingLevelFields`.

## Must never

- Store a second copy of the retail price (it stays `targetPrice`/`salePrice`).
- Re-implement the discount rules in a view — call `PricingMath`.
- Hold server state in a store; the till's `PosCart` owns the cart-level pricing.
