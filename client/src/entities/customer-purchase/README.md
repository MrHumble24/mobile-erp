# entities/customer-purchase

Buying a used phone from a customer (Change 14, ADR 0039) — a second way a unit
enters stock besides a supplier shipment. The trade-in at the till reuses the
same server write path but is posted through the sale (see `entities/sale`).

## Public API

- `useCustomerPurchases(filters)` — list, newest first (`purchase.read`).
- `useCustomerPurchase(id)` — one purchase.
- `useCreatePurchase()` — buy a phone (`purchase.create`); invalidates devices,
  stock, catalog, customers and ledger balances.
- `customerPurchaseRepository`, `customerPurchaseKeys`, and the view / DTO types.

## Invariants

- `pricePaid` is redacted (absent) without `device.cost.view`; never assume it.
- The unit is an IMEI or SERIAL product only; the server rejects QUANTITY (400)
  and a duplicate IMEI/serial (409). No open shift → 409 when shifts are on.

## Must never

- Store or ask for passport / document data — the seller is name + phone only.
- Call HTTP outside the repository, or hold the list in Zustand.
