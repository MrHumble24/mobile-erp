# stores

Store management and request-scoped active store resolution (ADR 0023, ADR 0045).

## HTTP (`/stores`)

- `GET /stores` — list active stores (or all if `store.manage`).
- `POST /stores` (`store.manage`) — create store; initializes cash/card ledger accounts.
- `PUT /stores/:id` (`store.manage`) — update store details.
- `POST /stores/:id/deactivate` (`store.manage`) — deactivates store (checks 0 stock, no open shifts).

## Resolution Service

- `StoresService.currentStoreId()` — resolves active store from `X-Store-Id` header and user permissions.
  Throws `STORE_REQUIRED` (400) if user has multiple stores and no header sent; `STORE_FORBIDDEN` (403)
  if user lacks access to selected store.
- `StoresService.currentStoreIds()` — returns array of active store IDs or allowed stores when `all` requested.
- `runWithStoreSelection(selection, fn)` — executes `fn` in an explicit store context (e.g. sync replay).

## Must never

Bypass `StoresService` to infer active store; leak unscoped store rows to callers.
