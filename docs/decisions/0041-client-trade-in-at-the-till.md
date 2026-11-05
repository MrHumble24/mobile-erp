# 0041 — Client trade-in at the till

Date: 2026-11-05
Status: Accepted

## Context

Change 14 (ADR 0039) adds buying used phones and taking a phone in part payment
at the till. The server takes a whole sale with `tradeIns[]`, but the web till
posts **one `POST /sales` per cart line**. A trade-in belongs to one sale and its
value may not exceed that sale's price, so the client must decide which line each
trade-in rides and reduce that line's tender. Where should this live under FSD?

## Decision

- **Trade-in state and logic live in `features/checkout`, not a new feature.** A
  trade-in is a negative tender on the cart — the same concern the checkout owns
  (cart, payments, submit). A separate feature would have to reach into the cart
  store, which FSD forbids (features never import features). The POS widget just
  renders the exported `TradeInSection`.
- **Allocation is a pure, tested helper.** `lib/allocate-trade-ins.ts` places each
  trade-in (largest first) on the line with the most remaining price that can
  carry it, refusing (`ok:false`) when none can. `lib/trade-in-plan.ts` derives the
  per-line payable and the amount to pay. Both are cents-safe and unit-tested with
  plain numbers, no React.
- **Cash omits payments; card/split send the payable.** The server computes due =
  `salePrice − Σ values`, so a cash line needs no `payments`; card/split send each
  line its `price − its trade-ins`. A fully-covered line (payable 0) sends no
  payments. A sold line's trade-in drafts are dropped, so a retry never resends.
- **The used-unit entry form is shared from `entities/device-model`**
  (`UsedUnitFields`), reused by `features/buy-phone` and the trade-in dialog, so the
  model/specs/IMEI-serial fields are defined once.

## Consequences

- A cart with a trade-in is online-only (never queued) and cannot be sold on
  credit; both are enforced in the checkout and surfaced in the POS.
- `Device.shipmentId` is nullable client-side; the drawer shows "Bought from a
  customer" when a unit has no shipment.
