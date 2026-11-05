# feature: repair-status

Move a ticket through the repair state machine (`repair.manage`). Uses the
`repair` entity's `allowedMoves` + `useChangeRepairStatus`.

## Exposes

- `RepairStatusActions` — a button per legal next status. Cancelling requires a
  reason; giving a phone back while money is still owed requires a reason and
  explains why. Other moves post directly. Server 409 codes
  (`REPAIR_ILLEGAL_MOVE` / `REPAIR_TERMINAL` / `REPAIR_BALANCE_OWED`) surface as
  readable toasts.

## Must never

- Offer an illegal move — only `allowedMoves(statusCode)` is rendered; the
  server is still the source of truth.
