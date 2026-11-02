# page: inventory

The `/inventory` screen: browse stock, inspect a device, manage models and
stock-alert rules. Composes entities and features; holds no HTTP of its own.

## Tabs
- **Devices** — filters (search debounced, model, status, storage), paginated
  table, IMEI scanner, detail drawer, edit dialog.
- **Models** (`device.update`) — `features/manage-device-model`.
- **Stock Alerts** (`device.read`; writes need `settings.manage`) —
  `features/manage-stock-alert-rule`.

## Local state (model/)
- `use-device-browser.ts` — filters + pagination; runs `useDevices`; resets to
  page 1 when a filter or page size changes.
- `use-device-selection.ts` — drawer target `{ imei, id? }` + edit-dialog state.

## Drawer
Resolves everything from `useDeviceByImei`, so a scanned IMEI that is not on the
current page still opens. Unknown IMEI → not-found state linking to `/shipments`.
Status changes use `entities/device` transition map + `expectedVersion`.

## Must never
- Call `fetch`/repositories directly, hold server data in local state, or render
  native form/table controls (use `shared/ui`).

## Open questions
- No server endpoint for distinct storage values; the filter uses a fixed list
  (`STORAGE_OPTIONS`). No cheap per-model device count, so the models tab omits it.
