# feature: repair-parts

Parts used on a repair ticket (`repair.manage`). A part is a quantity product
taken out of stock (`StockService` posts a `REPAIR_USE` movement server-side).
Composes the `catalog` and `repair` entities.

## Exposes

- `RepairPartsManager` — lists the parts, and (with `repair.manage` on a
  non-terminal ticket) adds one via `AddPartDialog` or removes one. Part costs
  (`partLineCost`) render only when the server returns them, i.e. the caller has
  `device.cost.view`.

## Must never

- Offer a non-quantity product — only `kindCode === "QUANTITY"` entries.
