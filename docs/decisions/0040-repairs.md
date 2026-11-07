# 0040 — Repairs

Date: 2026-11-05
Status: Accepted

## Context

The shop repairs phones (Change 13; not yet in the PRD). Built while the user
slept, so the recommended option is taken.

## Decision

- Optional `StoreSettings.repairsEnabled` (default false). Every `/repairs`
  route refuses **403 `REPAIRS_DISABLED`** when off.
- A `Repair` carries a per-store sequential `ticketNumber` (unique index), the
  customer (id or inline name+phone upserted by phone), free-text phone +
  optional modelId/IMEI/serial, problem, agreed price, **warranty days typed on
  the ticket** (no setting), and one master. "Which master" is **derived** from
  whichever of `masterUserId` / `outsideMasterName` is set — no isOutside flag.
- Status is a lookup (`repair_statuses`: RECEIVED, IN_REPAIR, READY, GIVEN_BACK,
  CANCELLED; last two terminal) + `repair_status_history` like devices. Illegal
  moves **409 `REPAIR_ILLEGAL_MOVE`**; editing / changing parts / taking a
  payment on a terminal ticket **409 `REPAIR_TERMINAL`**.
- **Nothing derivable is stored** (`repair-math.ts`): paid = Σ payments,
  outstanding = agreed − paid, parts cost = Σ parts, outside paid = Σ
  REPAIR_OUTSIDE rows, profit = paid − parts − outside, warranty from the
  given-back history row + warranty days.
- **Parts**: quantity products via `StockService`, a signed `REPAIR_USE`
  movement (out on add, back in on remove) freezing the average cost.
- **Money** via `LedgerService.post`, same tx: a `RepairPayment` (signed) →
  `REPAIR_PAYMENT` (refund = negative, capped at net paid, ADR 0028); an outside
  payment → `REPAIR_OUTSIDE` (out, a cost type, no business table — linked by
  `repairId`). Owed hand-over needs a reason (**409 `REPAIR_BALANCE_OWED`**).
  When `shiftsEnabled`, every money path calls `ShiftsService.assertCanSell`.
- Cost figures (parts/outside/profit) are null without `device.cost.view`.
  Permissions `repair.read`/`repair.manage`/`repair.payment`, ADMIN-only.

## Consequences

- No passcode/pattern, passport or ID-document column exists, by design.
- Ticket numbers race (single-shop, retried). The closing Telegram digest
  already covers repairs (their ledger rows sum into the balance).

## Amendments (2026-11-08)

Hardening pass (see `docs/plan/repairs-completion.md` and ADR 0067). These
amend the Decision above; the original feature shape is unchanged.

- `Repair.version` optimistic lock and `repair_mutations` idempotency keys guard
  every write; the sync handlers replay through those keys
  (`RepairIdempotency.findRepairIdByKey` / `replay` / `record`).
- Terminal guards now cover refund and outside payments too, and `outsideCost`
  is capped. Master XOR / FK validation and the customer upsert run inside the
  create transaction; the repair report is store-scoped.
- The web client gained an offline outbox (8 repair mutation types) and the
  server 8 matching sync handlers reusing the same idempotency keys.
- Accepted exception: native mobile repairs remain **ONLINE ONLY** — a native
  offline store for tickets is out of scope.
- Accepted exception: free-text phone is kept when no inventory device matches;
  a ticket is not forced onto a catalog device.
- `repair.read` / `repair.manage` / `repair.payment` stay **ADMIN-only**;
  cashiers get access only via explicit user permission overrides.
- Customer SMS/Telegram messaging requires an external provider (none ships);
  what ships are owner Telegram notifications and a printable/shareable ticket.
