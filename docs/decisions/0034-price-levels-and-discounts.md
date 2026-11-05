# 0034 — Price levels and discounts

Date: 2026-11-05
Status: Accepted

## Context

The till needs three prices — retail (walk-in), wholesale, partner (other
shops) — set per product and per storage, overridable per unit; the level
follows the customer and the seller may switch it. Lowering a price is a
discount, bounded by an owner limit and surfaced in reports (Change 12 + 7; not
yet in the PRD — the user owns that file). A phone sale stays tied to one unit.

## Decision

- **Levels are a lookup** `price_levels` (`RETAIL`/`WHOLESALE`/`PARTNER`),
  seeded in the migration **and** seed.sql (Railway runs only `migrate deploy`).
  A fourth level is a row.
- **One source of truth per retail price, no drift.** A unit's RETAIL own price
  stays in `Device.targetPrice`; a quantity product's RETAIL price stays in
  `DeviceModel.salePrice`. New `unit_prices(deviceId, levelCode)` holds a unit's
  WHOLESALE/PARTNER own prices; new `product_prices(modelId, storage, levelCode)`
  (storage `""` = any) holds product prices per storage for the other levels and
  a phone's per-storage RETAIL. Every query that read `targetPrice`/`salePrice`
  is untouched. Resolution order (`pricing/lib/price-resolution.ts`): unit own →
  product price for the storage → product price for any storage → none.
- **Checkout resolves the list price server-side.** `POST /sales` gains
  `priceLevelCode?` (default: the customer's level, else `RETAIL`) and
  `discount?{mode,value}`. The sent `salePrice` must equal list − discount or
  it is rejected 400 with the computed figure; `sale.price.override` sends any
  price (the gap becomes the discount); no list price = old behaviour. A
  discount needs `discountsEnabled` + its mode allowed and may not exceed the
  list price; its percent may not exceed max(cashier max, customer standing)
  unless `sale.discount.unlimited`. The sale stores a `listPriceSnapshot` and
  `priceLevelCode`; the discount amount is **derived**, never stored.
- **Sync replay trusts the till.** The offline push path (`trustClientPrice`)
  is never rejected for a mismatch — the sale already happened; it stores the
  claimed list price or derives it.
- **Consignment** defaults its agreed price to the unit's PARTNER list price;
  an explicit price wins.
- **Reads carry resolved `prices{RETAIL,WHOLESALE,PARTNER}`** on catalog cards +
  units, scan, device detail, stock list and the sync feed, so a till switches
  level offline. New permissions `price.manage`, `sale.price.override`,
  `sale.discount.unlimited` — ADMIN only, seeded in the migration and seed.sql.
- **Settings** gain discount switches/presets/cashier-max; **reports** profit
  gains `discountsGiven` (Σ snapshot − salePrice); sale views carry `listPrice`,
  `discountAmount`, `priceLevelCode`.

## Consequences

- `targetPrice`/`salePrice` keep meaning "the retail price" in every request and
  response; existing data reads identically after the migration.
- The RETAIL-in-column / other-levels-in-table split is asymmetric but confined
  to one resolver and one repository; a future full move into the tables would
  only touch those two files.
