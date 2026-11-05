# 0006 — Landed-cost allocation and rounding

Date: 2026-11-01
Status: Superseded by ADR 0026 (2026-11-05)

> Superseded: the even overhead spread below is gone. A shipment no longer has
> an `overheadCost`; each phone carries its own `unitExpense` (and, per ADR
> 0027, `customsFee`). Landed cost is now `acquisitionCost + customsFee +
> unitExpense`, computed per phone in `devices/lib/landed-cost.ts`. The
> cost-redaction note at the end still holds (costs are stripped without
> `device.cost.view`).

## Context

Each shipment carries an `overheadCost` (shipping, customs) that must be spread
across its units to produce `Device.landedCost` (the cost basis for margin).
Units in a batch can have different `acquisitionCost`. We need one deterministic
rule, applied identically on intake and whenever overhead or the unit count
changes, with money kept exact (`Decimal(14,2)`).

## Decision

`landedCost = acquisitionCost + round(overheadCost / deviceCount)`, where the
per-unit overhead share is rounded to 2 decimals, half-up. The rule lives in one
pure function, `shipments/lib/landed-cost.ts::computeLandedCost`, implemented
with integer-cent math (no float drift, no Prisma Decimal runtime dependency) so
it is trivially unit-tested (`landed-cost.spec.ts`).

Recomputation runs for every device in the shipment inside a single transaction
whenever a device is registered (`POST /shipments/:id/devices`) or `overheadCost`
changes (`PATCH /shipments/:id`). Device intake and landed-cost allocation are
owned by the `shipments` module (not `devices`), because allocation is a
batch-level concern; per-unit lifecycle stays in `devices`.

## Consequences

- Rounding can leave a sub-cent residual between total overhead and the summed
  shares; this is accepted (no penny-distribution pass) because overhead is an
  estimate and sales snapshot `landedCost` at sale time.
- Changing overhead rewrites `landedCost` on all units in the batch, including
  already-sold ones; historical margin is protected by the sale's own
  `landedCostSnapshot`, not by the live `landedCost`.
- `overheadCost`, `landedCost` and `repairCostEstimate` are cost-restricted
  (stripped unless `device.cost.view`).
