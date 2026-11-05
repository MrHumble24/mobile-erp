# 0033 — Client quantity-product stock

Date: 2026-11-05
Status: Accepted

## Context

The server gained quantity-product stock (ADR 0030): buy, count, sell, correct
products counted by pieces, with a sale's `device` now nullable. The web client
had to catch up without breaking a single phone sale. (Not yet in the PRD — the
user owns that file.)

## Decision

- **Nullable sale subject.** A quantity sale has `device: null` + `model` +
  `quantity`. One structural helper `shared/lib/sale-subject.ts` (`saleModelName`,
  `saleUnitCode`) resolves either shape — no entity import, so
  sale, customer and report slices share it. No caller reads `sale.device.…`.
- **`stock` entity** owns the read/adjust side (`GET /stock`, `/stock/:id/movements`,
  `POST /stock/adjust`): repository, key factory, hooks, movement-label map, and
  the offline product-cache read. One feature per action: `adjust-stock`
  (write-off / count correction) and `add-stock-to-shipment` (buy lines).
- **Scan is a feature** (`scan-code`), not an entity: `GET /scan/:code` returns a
  unit (a device type) *or* a product (a stock type), and an entity may not import
  a sibling entity. The feature composes both and the POS widget drives it.
- **Cart is a discriminated union** (`UnitCartLine | QuantityCartLine`). The split
  maths stays on a `{lineId, total}` projection (`toLinePrices` + `lineTotal`, cents),
  so a mixed cart's Cash/Card/Split allocates line by line unchanged. A quantity
  line queues offline with `modelId` + `quantity` and no `baseVersion` (no lock).
- **Offline** adds a `products` IndexedDB store (DB v3), filled from the changes
  feed's `products[]`; an offline barcode scan reads it.

## Consequences

- The server has **no GET for a shipment's quantity lines**, so the shipment
  detail shows only lines added in the current session (documented in the
  `add-stock-to-shipment` README). A `GET /shipments/:id/items` would fix it.
- Inline adjust-form validation messages are raw English (the device-model form's
  existing convention), mirroring the `catalog` i18n copy.
