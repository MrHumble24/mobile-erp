# entity: bonus

A customer's loyalty points (ADR 0043): the balance, the append-only history, and
the owner's manual correction. One point = one unit of money.

## Owns

- Domain types for `GET /customers/:id/bonus` and
  `POST /customers/:id/bonus/adjustments` (`model/bonus.types.ts`).
- `bonusRepository` — the only HTTP caller for the points routes.
- `bonusKeys` — the query-key factory (detail per customer).
- `useCustomerBonus(customerId)` — balance + history + the `enabled` flag.
- `useAdjustCustomerBonus()` — a correction that invalidates this customer's
  points and the POS customer-lookup balances.

## Public API

Everything re-exported from `index.ts`. Never import a deep path.

## Must never

- Compute a balance client-side; the server owns the signed sum.
- Show points UI on its own: the caller checks `enabled` first.
