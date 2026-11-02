# widget: device-drawer

Shared device detail drawer. Resolves a device from an IMEI via
`useDeviceByImei` (so a scanned IMEI not on the current page still opens),
and renders status, specs, latest QC summary, status history and the
status-change form. Used by `pages/inventory` and `pages/qc`.

## Public API
`DeviceDrawer({ imei, open, onClose, onEdit?, onInspect? })`.
- `onEdit` — shown (with `device.update`) as the Edit button; the page owns the
  edit dialog.
- `onInspect` — shown when the device is `IN_STOCK`/`DEFECTIVE`; the page owns
  the inspection dialog.

Permissions (`device.cost.view`, `device.status.change`, `device.update`) are
read from the auth store inside the widget.

## Must never
- Hold server data in local state or call repositories directly (hooks only).
- Render native form/table controls — use `shared/ui`.
