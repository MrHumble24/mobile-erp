# 0007 — Checkout idempotency, landed-cost snapshot, DEFECTIVE not sellable

Date: 2026-11-01
Status: Accepted

## Context

POS terminals run offline and replay queued mutations, so `POST /sales` can
arrive more than once. Device landed cost is re-derived over time, but a sale's
margin must reflect the cost at sale time. The PRD leaves open whether a
DEFECTIVE device can be sold directly (GAP in `docs/plan/build-waves.md`).

## Decision

- **Idempotency**: a client sends an optional `clientMutationId` (unique on
  `sales`). If a sale with that id already exists the endpoint returns it with no
  side effects. A concurrent duplicate that races past the pre-check is caught on
  the unique violation (P2002) and the existing sale is returned.
- **landedCostSnapshot**: `Device.landedCost` is copied onto the sale at checkout.
  Later cost edits never rewrite sold history.
- **netProfit is derived**, never stored: `salePrice − landedCostSnapshot`,
  computed in the sale mapper and redacted for cashiers by the cost interceptor.
- **DEFECTIVE is not sellable** (plan default until the PRD GAP is resolved):
  checkout requires the device to be IN_STOCK, enforced atomically by the device
  update's `where {statusCode: 'IN_STOCK', version}` guard (409 on mismatch).

## Consequences

- Safe offline replay; no double-charge, no double status transition.
- Historical margins are stable. If the DEFECTIVE-sale policy changes, relax the
  checkout status guard only — the snapshot and idempotency logic are unaffected.
