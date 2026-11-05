# catalog-sell

The till catalog mode (ADR 0031, Change 5): a shop-like grid of product cards
the seller taps to sell. Composes `entities/catalog` (grid + units) and
`entities/product-category` (chips).

## Exposes

- `CatalogBrowser` — search box, category chips and a responsive product grid.
  Props: `excludeUnitIds` (cart unit ids, never re-offered), `onPickUnit`,
  `onPickQuantity`.

## Behaviour

- A quantity product → `onPickQuantity(entry)` (the widget adds qty 1 / raises it).
- A unit product → fetches its in-stock units, drops the ones already in the
  cart; the only one → `onPickUnit`, otherwise the unit picker sheet opens.

## Must never

- Touch the cart store or know about checkout — it emits picks through
  callbacks; the pos-terminal widget maps them into cart lines. (A feature may
  not import another feature.)
