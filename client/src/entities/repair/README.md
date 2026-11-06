# entity: repair

Repair tickets (Change 13, ADR 0040). Optional, off by default
(`StoreSettings.repairsEnabled`); every `/repairs` call 403s `REPAIRS_DISABLED`
when off, so the UI hides the slice entirely. A phone is taken in for a
customer, fixed by the shop's own master or an outside one, and given back under
a per-ticket warranty.

## Exposes (public API)

- Types mirroring the server `RepairView` / `RepairListItem` / `RepairReport`
  and the write DTOs.
- `repairRepository` — the only HTTP caller for `/repairs`.
- `repairKeys` — the query-key factory.
- Query hooks: `useRepairs`, `useRepair`, `useRepairReport`.
- Mutation hooks: create / update / change-status / add-part / remove-part /
  payment / refund / outside-payment. Each invalidates the ticket (+ ledger for
  money, + stock for parts).
- State machine + math: `allowedMoves`, `isLegalMove`, `isTerminal`,
  `leftToPay`, `isOwed`, `isOverpaid` (pure, unit-tested).
- `repairErrorKey(err)` — maps server conflict/shift codes to `repairs.*` keys
  through the shared `httpErrorCode`.
- Base UI: `RepairStatusBadge`, `RepairTicketPaper` (printable customer copy).

## Must never

- Store or render a derived figure — `paid`, `outstanding`, warranty come from
  the server. Cost figures (`partsCost`, `outsidePaid`, `profit`, part costs)
  are null without `device.cost.view`; never show "null" or a fake 0.
- Hold a passcode / pattern or any passport / ID data (none exists, by design).
