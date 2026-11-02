# devices slice

Owns the `/inventory` page (Devices / Models / Alerts tabs) and the device
detail sheet. Composes the `device_models` and `stock_alerts` slices for the
latter two tabs.

## Exposes (`devices_module.dart`)
- `devicesRoutes` — `/inventory` behind `PermissionGate('device.read')`.
- `devicesNavItems` — one nav entry (`nav.inventory`).

## What it does
- **Offline-first list**: the Devices tab reads the Drift `devices` cache via
  `DeviceRepository.watchDevices()` (hydrated by the foundation `/sync/changes`
  pull). Filter/search/metrics run client-side over that stream.
- **Detail sheet** (`showDeviceSheet`): fetches full detail + history from the
  API (`/devices/by-imei/:imei`, `/devices/:id/history`) — not in the cache.
  Margin/landed-cost gated on `device.cost.view`; status form on
  `device.status.change`; edit on `device.update`.

## Must never
- Edit shared/foundation files or another slice. Writes (edit, status change)
  are online-only (not outbox mutations) — gated on `connectivityProvider`.
