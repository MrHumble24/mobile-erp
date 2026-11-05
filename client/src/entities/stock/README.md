# stock

Quantity-product stock (ADR 0030): the web client's read/adjust side of the
server `stock` module. A `QUANTITY` product's level is the sum of its signed
movements and may be negative (an offline till may oversell).

## Exposes (public API)

- Types: `StockLevelView`, `StockMovement`, `StockMovementPage`, `StockFilters`,
  `AdjustStockDto`, `StockScanProduct`, `ProductChange`.
- `stockRepository` (`GET /stock`, `GET /stock/:id/movements`, `POST /stock/adjust`)
  and `stockKeys`.
- Hooks: `useStock(filters)`, `useStockMovements(modelId, page)`,
  `useAdjustStock()`.
- `movementLabelKey(typeCode)` → the `catalog` i18n key for a movement type.
- `getCachedProductByBarcode(barcode)` — offline cache lookup (products store).

## Must never

- Call `fetch`/`http` outside the repository, or hold stock levels in Zustand
  (server state is React Query only). `averageCost`/`value`/`unitCostSnapshot`
  are null without `device.cost.view`; the UI hides those columns.
