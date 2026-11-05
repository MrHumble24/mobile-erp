# catalog

The read model behind the till's product grid (ADR 0031, Change 5). Owns no
tables: like `reports` it reads the catalog / device / stock tables directly
(never through those modules' write services) because it is a pure cross-table
read. Everything is scoped to the current store (`StoresService`).

"Sellable" is a unit with `statusCode = IN_STOCK`; consigned, sold and defective
units drop out of both reads.

## Exposes (REST `/catalog`)

- `GET /` (`device.read`) `?categoryId&search` → `CatalogEntry[]`, one card per
  product:
  - IMEI/SERIAL product with ≥ 1 IN_STOCK unit: `inStock` (unit count),
    `minTargetPrice`/`maxTargetPrice` over those units, `salePrice: null`.
  - active QUANTITY product: `inStock` (summed quantity, may be ≤ 0),
    `salePrice`, price range null.
  - Both carry `brand`, `name`, `kindCode`, `categoryId`/`categoryName` and
    `imageUrl`. `search` matches name, `modelCode` and (for units) the storage
    spec; sorted by brand then name.
- `GET /:modelId/units` (`device.read`) → `CatalogUnit[]`: the IN_STOCK units of
  a product — `id`, `code` (IMEI or serial), `specs`, latest QC `gradeCode`,
  `targetPrice`. What the seller picks from after tapping a card.

## Must never

- Inject another module's repository, or write anything (read-only).
- Return a consigned / sold / defective unit (filter by IN_STOCK).

Target/sale prices are sale-side, not cost, so nothing here is redacted.
