# stock (page)

Route `/stock` (nav `nav.stock`, visible with `device.read`). Lists quantity
products with their level, price and — with `device.cost.view` — average cost
and value (ADR 0030). A clear mark for out-of-stock and a danger mark for a
below-zero level (an offline till may oversell). Filter by category, search by
name / barcode / model code.

## Composes

- `entities/stock` (`useStock`, movements), `features/adjust-stock`
  (`AdjustStockDialog`, shown only with `stock.adjust`),
  `entities/product-category` (category filter).
- A product's movements open in a paginated drawer.
- With `priceTagsEnabled`, `features/print-price-tags` prints tags for the rows
  on screen.

## Must never

- Hold stock in local state, or show cost columns without `device.cost.view`.
