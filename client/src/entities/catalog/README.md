# catalog

The till product grid read-model (ADR 0031, Change 5). One card per sellable
product: a unit product (≥ 1 IN_STOCK unit, with a count and a price range) or
an active quantity product (with its per-piece `salePrice`).

## Exposes

- `useCatalog(filters?)` — the grid; `filters` is `{ categoryId?, search? }`.
- `useCatalogUnits(modelId | null)` — the in-stock units of one product (for the
  pick-a-unit sheet); enabled only while a modelId is set.
- `catalogRepository`, `catalogKeys`.
- `CatalogEntry`, `CatalogUnit`, `CatalogFilters`.

## Offline

`list`/`units` fall back to the synced device + product caches on a network
error (never on a 4xx/5xx), so the seller can still tap to sell. The cache has
no model code, so offline search matches name + storage only.

## Must never

- Add to the cart or know about the cart — it returns data; the pos-terminal
  widget maps a picked unit into a cart line.
- Import a sibling entity (device/stock/sync): offline shapes are declared
  structurally in `lib/cached-catalog.ts`.
