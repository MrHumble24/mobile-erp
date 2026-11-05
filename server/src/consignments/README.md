# consignments

B2B "Nasiya" device transfers and their resolution (PRD Module 4).

## Exposes (HTTP, all under `/consignments`)

- `POST /` — `consignment.create`. One-tap transfer. `{ imei?, serialNumber?,
  partnerId, agreedPrice?, dueDate, notes?, clientMutationId?, expectedVersion? }`.
  `agreedPrice` is optional: omitted, it defaults to the unit's PARTNER list
  price (ADR 0034; 400 if the unit has none); an explicit value always wins.
  Send **exactly one** of `imei`/`serialNumber` (400 otherwise); resolved against
  imei, imei2 or serialNumber (ADR 0029). Idempotent on `clientMutationId`;
  device must be IN_STOCK (409 otherwise); enforces the partner credit limit
  (409 with the numbers).
- `GET /` — `consignment.read`. Filters `partnerId`, `statusCode`,
  `overdue=true`, `search` (imei, imei2, serialNumber or partner shop name),
  `from`/`to` (ISO bounds on `consignedAt`); paginated (`page`, `pageSize`). Rows
  carry `imei`/`imei2`/`serialNumber`, `kindCode`, `partnerShopName` and `saleId`
  (set once SETTLED). Where-builder in `lib/consignment.where.ts` (unit-tested).
- `GET /stats` — `consignment.read`. Tiles for the filtered set:
  `{ total, openCount, overdueCount, outstanding }`. Status/overdue are dropped
  from the base so the breakdown shows regardless of the active tab.
- `GET /overdue` — `consignment.read`. OUT past `dueDate`, with partner contact
  (for the wave-3 Telegram job).
- `GET /:id` — `consignment.read`.
- `POST /:id/settle` — `consignment.settle`. `{ salePrice?, notes?,
  expectedVersion? }`. 409 if not OUT.
- `POST /:id/return` — `consignment.settle`. `{ reason?, condition?, expectedVersion? }`.
  `condition` (`IN_STOCK` default | `DEFECTIVE`) is the device status to restore.
  409 if not OUT.

## Invariants

- Resolution is atomic: the consignment, the device status + history row, and
  (on settle) the Sale all change in one `$transaction`.
- Device status flips under an optimistic lock: `updateMany where {id, version}`
  + `version+1`, 409 on no match or stale `expectedVersion`.

## Cross-module writes (route through DevicesService.changeStatus / SalesService after wave 2 merge)

These live in `consignments.write.repository.ts` only for transactional
atomicity while inventory/sales do not yet exist:

- `device.updateMany` (statusCode + version) + `deviceStatusHistory.create`:
  IN_STOCK→CONSIGNED (create), CONSIGNED→SOLD (settle), CONSIGNED→IN_STOCK (return).
- `sale.create` with `consignmentId` + `landedCostSnapshot` on settle (no Warranty for B2B).

## Must never

- Post a ledger row on settle. A B2B unit brings money in when the partner pays
  (`PARTNER_PAYMENT`, in `partners`); posting on the settle sale would
  double-count it (ADR 0025). This module does not depend on `LedgerModule`.
