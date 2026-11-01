# consignments

B2B "Nasiya" device transfers and their resolution (PRD Module 4).

## Exposes (HTTP, all under `/consignments`)

- `POST /` — `consignment.create`. One-tap transfer. `{ imei, partnerId,
  agreedPrice, dueDate, notes?, clientMutationId?, expectedVersion? }`.
  Idempotent on `clientMutationId`; device must be IN_STOCK (409 otherwise);
  enforces the partner credit limit (409 with the numbers).
- `GET /` — `consignment.read`. Filters `partnerId`, `statusCode`,
  `overdue=true`; paginated (`page`, `pageSize`).
- `GET /overdue` — `consignment.read`. OUT past `dueDate`, with partner contact
  (for the wave-3 Telegram job).
- `GET /:id` — `consignment.read`.
- `POST /:id/settle` — `consignment.settle`. `{ salePrice?, notes?,
  expectedVersion? }`. 409 if not OUT.
- `POST /:id/return` — `consignment.settle`. `{ reason?, expectedVersion? }`.
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
