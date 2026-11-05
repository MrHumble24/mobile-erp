# 0023 — Stores skeleton

Date: 2026-11-05
Status: Accepted

## Context

A cash/card ledger per store is coming. A ledger born without a store would
have to be retrofitted. No real data exists yet, so the cheap moment to anchor
every stock and money row to a store is now — before the ledger, not after.

## Decision

- New `stores` table; exactly one store today (`Store`: id, name, address?,
  phone?). No active/closed flag yet.
- `storeId` (NOT NULL, FK, indexed) on the seven rows that belong to a store:
  `Device`, `Shipment`, `Sale`, `Expense`, `ExpenseRecurrence`, `Consignment`,
  `PartnerPayment`.
- Derived, so no column: `SaleReturn`, `Warranty`, `QcInspection`, `QcDefect`,
  `DeviceStatusHistory`, `SyncConflict` (store comes from their parent).
- `Sale`/`Consignment`/`PartnerPayment` carry their own `storeId` (not a copy of
  `Device.storeId`): once a unit can move between stores, these freeze where the
  event happened. See ADR 0007 — checkout only gains a server-filled `storeId`;
  idempotency and the landed-cost snapshot are untouched.
- Store identity moved out of `store_settings` into `stores` (one home);
  `store_settings` stays a singleton. The settings API shape is unchanged —
  `SettingsService` reads and writes identity through `StoresService`.
- `StoresService.currentStoreId()` is the single point that decides which store a
  write targets; no other code queries `stores` to pick one. Two writes inherit
  from their parent row instead: a spawned recurring expense takes its template's
  `storeId` (ADR 0017), and a settle sale takes its consignment's `storeId`.

## Consequences

- Company-wide aggregates stay store-unaware for now and are **not** filtered:
  partner `outstanding` balance (ADR 0008), report aggregates (ADR 0009), and the
  `GET /sync/changes` feed plus `sync_conflicts` (ADR 0011, no store column).
- Per-store filtering, a store picker, stock transfers and the ledger are future
  work. `currentStoreId()` becomes user-scoped when stores multiply.
