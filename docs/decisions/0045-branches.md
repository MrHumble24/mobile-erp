# 0045 — Multi-store branches and stock transfers (server)

Date: 2026-11-05
Status: Accepted

## Context
A phone shop owner operates multiple branch locations. Data (devices, stock,
ledger, shifts, expenses, sales) must be scoped by store, while products,
customers, and partners remain shared. Stock moves between stores via transfers.

## Decision
- **Stores resource**: `GET/POST/PUT /stores`, `POST /stores/:id/deactivate`.
  Deactivation requires 0 stock and no open shifts. Store creation initializes cash/card
  accounts and per-store settings.
- **Store scoping via header**: `X-Store-Id` on requests. Handled by `StoresService.currentStoreId()`:
  validates user store membership (or `store.all` permission). Missing header with 1 store
  auto-resolves; with multiple returns 400 `STORE_REQUIRED`; unauthorized store returns 403.
- **Read & write scoping**: All queries on store-scoped tables filter by active store.
  `X-Store-Id: all` allowed only on `@AllowAllStores()` endpoints (reports, ledger balances).
- **Warranty cross-store lookup**: Warranty is honoured across all branches (`GET /sales/warranty/:imei`
  remains company-wide). When a sale belongs to another branch, `salePrice` and cost/profit
  fields are redacted (`null`), and `storeName` identifies the branch that sold it.
- **Stock transfers** (`/stock-transfers`): Lines are `UNIT` (device) or `QUANTITY` (stock).
  Sending puts units in `IN_TRANSIT` and debits origin quantity stock (frozen cost).
  Receiving credits target store. Cancelling returns items to origin. In-transit units
  cannot be sold, consigned, repaired, or transferred.

## Consequences
- Single resolution point in `StoresService` ensures complete scoping without leaking rows.
- Daily closing digests iterate active stores and evaluate schedule/sent markers per store
  inside `runWithStoreSelection`, formatting breakdown blocks per store.
