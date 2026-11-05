# 0030 — Quantity-product stock

Date: 2026-11-05
Status: Accepted

## Context

The shop also sells accessories counted by quantity (cases, cables, chargers,
protectors). ADR 0029 added the `QUANTITY` product kind but nothing could be
bought, stocked, sold, returned or counted. (Change 8 second half; not yet in
the PRD — the user owns that file.)

## Decision

- Stock is an **append-only, signed movement log** (`stock_movements`, new
  `stock.prisma`), like the cash ledger: one row per movement, a product's
  quantity in a store is `SUM(quantity)`, its value `SUM(quantity ×
  unitCostSnapshot)`, its moving-average cost `value ÷ quantity`. Nothing
  derived is stored. Types are a lookup (`PURCHASE/SALE/RETURN/WRITE_OFF/
  COUNT_CORRECTION`), seeded in the migration **and** seed.sql. The arithmetic
  is one pure function (`stock/lib/stock-math.ts`); at zero-or-below stock the
  average falls back to the latest `PURCHASE` cost. Stock may go **below zero**
  (an offline till may oversell) — reads expose it, nothing is blocked.
- Every **outgoing** movement stamps the average cost at that moment as its
  `unitCostSnapshot`, so value stays self-consistent. Snapshots are `Decimal(14,2)`.
- **Buying**: `POST /shipments/:id/items` — each line writes a `PURCHASE`
  movement + one `PURCHASE` ledger row (money out) from the shipment's store and
  account, in one transaction (`device.create`).
- **Selling**: `POST /sales` accepts `{ modelId, quantity, salePrice }` as a
  third mutually-exclusive way (`sale-target.ts`). A quantity sale is a `Sale`
  with no device: `salePrice` is the line total, `landedCostSnapshot = quantity
  × average`, computed inside the checkout tx with a `SALE` movement. No
  warranty. Idempotent by `clientMutationId`. A DB CHECK keeps a sale unit-XOR-
  quantity. Returns restore stock (`RETURN` at the sale's own unit cost).
- **Correcting**: `POST /stock/adjust` — write-off (note required) and count
  correction (server writes `counted − current`). New permission `stock.adjust`
  (ADMIN only). Reads (`GET /stock`, `/stock/:id/movements`) reuse `device.read`;
  cost/value fields hidden without `device.cost.view`.
- **Scan**: `GET /scan/:code` (`device.read`) → a unit (ADR 0029 lookup) or a
  quantity product by barcode; units win; 404 otherwise.
- `DeviceModel.salePrice` is the default till price per piece.

## Consequences

- Reports, the changes feed and the daily digest read a sale's product through
  `device` **or** the sale's own `modelId`. Model-pricing stays phone-centric.
  Average cost has a known race under concurrent sales — accepted (offline till).
