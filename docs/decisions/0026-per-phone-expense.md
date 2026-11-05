# 0026 — Per-phone expense replaces shipment overhead

Date: 2026-11-05
Status: Accepted (supersedes ADR 0006)

## Context

A shipment used to carry one `overheadCost` spread evenly over its phones
(ADR 0006). The client decided a shipment has no expense of its own: each phone
has its own expense, editable at any time — also after it is sold — and the
shipment's expense is just the sum of its phones'.

## Decision

- `Device` gains `unitExpense` (Decimal(14,2), default 0) and an optional
  `unitExpenseNote`. `Shipment.overheadCost` is dropped.
- Landed cost is now `acquisitionCost + customsFee + unitExpense`, computed per
  phone by the single pure function `devices/lib/landed-cost.ts::computeLandedCost`
  (customs fee is ADR 0027; 0 until then). There is no batch allocation.
- The migration carries each existing phone's current overhead share into its
  `unitExpense` (`landedCost − acquisitionCost`) so no landed cost changes, then
  drops `overheadCost`. No ledger rows are posted for this conversion — that
  money already left through the old `OVERHEAD` rows. `OVERHEAD` stays in the
  type lookup but is marked inactive; it still labels old history rows.
- Setting or changing `unitExpense` posts a new ledger type `DEVICE_EXPENSE` for
  the **difference** only (zero difference posts nothing), linked to the device,
  from the shipment's fixed payment account and store (same rule as `PURCHASE`).
- Entering or changing it needs the `device.expense` permission (ADMIN only),
  at intake (per device) and via `PATCH /devices/:id/expense`. A request with a
  non-zero `unitExpense` and no permission is rejected 403.
- A sale keeps its `landedCostSnapshot`; a later expense change never rewrites
  it. `unitExpense`/`unitExpenseNote`/`unitExpenseTotal` are cost-restricted.

## Consequences

- Shipment responses gain a computed `unitExpenseTotal`; nothing is stored on
  the shipment. The shipment edit path no longer posts any ledger row.
- The difference posters (intake and the expense edit) share the shape of the
  overhead-delta poster they replace; the lost-update lock is ADR 0025's fix.
