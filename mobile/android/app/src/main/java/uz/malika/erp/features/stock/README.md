# features/stock

Quantity-product stock (ADR 0030): the one screen for products counted by the
piece (cases, cables, chargers). Nav item `stock` (`nav.stock`), gated by
`device.read`.

## Owns
- `data/` — `StockApi` (`/stock`, `/stock/:id/movements`, `/stock/adjust`,
  `/product-categories`), transport DTOs, the `StockLevel` / `StockMovement`
  domain, and `StockMath` (the count-correction difference, unit-tested).
- `model/StockViewModel` — the list, filtered server-side by category + a
  name/barcode/model-code search.
- `ui/` — `StockScreen` (list), `StockDetailSheet` (one product's level +
  movements, paged), `StockAdjustDialog` (write-off / count correction).

## Invariants
- Quantity may be **negative** (oversold); the row marks it with the danger
  colour and `catalog.belowZero`, zero with `catalog.outOfStock`. Stock is never
  blocked here — reads only.
- Cost fields (`averageCost`, `value`, a movement's `unitCost`) are
  redaction-nullable: shown only when the server sends them (with
  `device.cost.view`). The adjust actions show only with `stock.adjust`.
- Counts are whole numbers, money is a decimal string — never a `Double`.

## Must never
- Store or derive a stock level locally — the server sums its movement log.
- Talk to another slice's repository; it owns only `/stock` + categories.
