# stock

Quantity-product stock (ADR 0030). Owns `stock_movements` and the
`stock_movement_types` lookup. Append-only and signed, like the cash ledger: a
product's quantity in a store is the SUM of its movements, never a stored
number. Only `QUANTITY` models (ADR 0029) have stock.

## Arithmetic (`lib/stock-math.ts`, pure, unit-tested)

- `foldStock(movements)` → `{ quantity, value, latestPurchaseCost }`.
- `averageCost(agg)` = `value ÷ quantity` while positive, else the latest
  `PURCHASE` unit cost (0 if none). This is the single source of truth; every
  outgoing movement stamps it as `unitCostSnapshot`. Stock may go below zero.

## Exposes (REST `/stock`)

- `GET /` (`device.read`) `?categoryId&search` → `StockLevelView[]`: every
  QUANTITY product with `quantity` (may be negative), and — only with
  `device.cost.view` — `averageCost` and `value` (else null). `search` matches
  name/barcode/brand/modelCode.
- `GET /:modelId/movements` (`device.read`) `?page&pageSize` → newest-first
  movements; `unitCostSnapshot` null without `device.cost.view`.
- `POST /adjust` (`stock.adjust`, ADMIN only) `{ modelId, type, quantity?,
  countedQuantity?, note? }` → the product's new level. `WRITE_OFF` removes
  `quantity` pieces and **needs a note**; `COUNT_CORRECTION` writes
  `countedQuantity − current` (nothing when zero). Neither moves money.

## Primitives for other modules (tx-aware, never a repo leak)

`StockService.aggregate / averageCost / postMovement` — `sales` posts
SALE/RETURN movements and `shipments` posts PURCHASE movements inside their own
transaction. `findByBarcode` (scan), `productsForFeed` (sync),
`totalStockValue` (inventory report), `assertQuantityModel` (validation).

## Must never

- Store a quantity, value or average — always sum. Update or delete a movement.
- Let another module inject `StockRepository` — inject `StockService`.
