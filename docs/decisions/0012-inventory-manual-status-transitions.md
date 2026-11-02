# 0012 — Inventory manual status transitions

Date: 2026-11-02
Status: Accepted

## Context
The server accepts eight device status transitions. Several of them
(IN_STOCK→CONSIGNED, IN_STOCK→SOLD, CONSIGNED→SOLD) are side effects of other
business flows: a sale is created in POS, a consignment hand-off in Nasiya. If
the inventory screen offered those as free-form "change status" actions it would
let a user move a device to SOLD without a sale record, drifting the ledger.

## Decision
The inventory drawer offers only transitions that are manual by nature:
IN_STOCK→DEFECTIVE, DEFECTIVE→IN_STOCK, SOLD→IN_STOCK, SOLD→DEFECTIVE (warranty
return). The allowed set lives in `entities/device/model/device-transitions.ts`
as plain data. CONSIGNED/SOLD targets are never shown; a hint line points the
user to POS / Nasiya instead. The call sends `expectedVersion`; a 409 refetches
the device and asks the user to retry, a 400 surfaces the server message.

## Consequences
- The transition policy is one source of truth, reused by any future caller.
- Adding a manual transition is a data edit, not new UI branching.
- The client cannot create ledger-affecting status changes out of band.
