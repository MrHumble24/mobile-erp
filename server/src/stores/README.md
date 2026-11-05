# stores

The store a stock or money row belongs to (ADR 0023). One store today; born
multi-store so the upcoming cash/card ledger carries a store from day one.

## Owns

- `stores` table: `id`, `name`, `address?`, `phone?`. Store identity lives here,
  not in `store_settings`.
- The decision of which store a write targets.

## Exposes

- `StoresService.currentStoreId()` — the single resolution point. Today returns
  the only store; later the signed-in user's chosen store. Every create of a
  store-scoped row (device, shipment, sale, expense, recurrence template,
  consignment, partner payment) routes through this.
- `StoresService.getIdentity()` / `updateIdentity(data)` — identity read/write,
  used by `SettingsService` so the settings API shape stays unchanged.

## Must never

- Let another module query `stores` to pick a store, or inject
  `StoresRepository` directly — import `StoresModule`, inject the service.
- Grow a controller or route: nothing is exposed over HTTP yet.

## Open questions

- Scoping `currentStoreId()` to the user (store picker) and stock transfers
  between stores — future work, out of this skeleton.
