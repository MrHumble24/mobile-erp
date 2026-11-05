# page: inventory

The `/inventory` screen: browse stock, inspect a device, manage models and
stock-alert rules. Composes entities and features; holds no HTTP of its own.

## Tabs
- **Devices** — filters (search debounced, model, status, storage), paginated
  table, unit-code scanner (IMEI or serial), detail drawer, edit dialog.
- **Models** (`device.update`) — `features/manage-device-model`.
- **Categories** (`device.update`) — `features/manage-product-category`.
- **Stock Alerts** (`device.read`; writes need `settings.manage`) —
  `features/manage-stock-alert-rule`.

## Local state (model/)
- `use-device-browser.ts` — filters + pagination; runs `useDevices`; resets to
  page 1 when a filter or page size changes.
- `use-device-selection.ts` — drawer target `{ imei, id? }` + edit-dialog state.

## Drawer
Uses the shared `widgets/device-drawer` (`DeviceDrawer`), which resolves
everything from `useDeviceByImei`, so a scanned IMEI not on the current page
still opens. Unknown IMEI → not-found state linking to `/shipments`. Status
changes use `entities/device` transition map + `expectedVersion`. The devices
tab passes `onEdit` to surface the edit dialog it owns.

## Must never
- Call `fetch`/repositories directly, hold server data in local state, or render
  native form/table controls (use `shared/ui`).

## Open questions
- The storage filter lists the union of every active model's `storage` attribute
  options, falling back to `STORAGE_OPTIONS` when no model defines any. No cheap
  per-model device count, so the models tab omits it.
