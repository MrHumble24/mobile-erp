# widget: device-drawer

Shared device detail drawer. Resolves a device from an IMEI via
`useDeviceByImei` (so a scanned IMEI not on the current page still opens),
and renders status, specs, latest QC summary, status history and the
status-change form. For cost-permitted users it also shows the phone expense
(with note), customs fee and landed cost, with hand-edit dialogs (ADR 0026/0027):
`device.expense` edits the expense, `customs.manage` the customs fee — both via
`PATCH /devices/:id/expense` and `/customs-fee`. Used by `pages/inventory`
and `pages/qc`.

## Public API
`DeviceDrawer({ imei, open, onClose, onEdit?, onInspect?, onSell? })`.
- `onEdit` — shown (with `device.update`) as the Edit button; the page owns the
  edit dialog.
- `onInspect` — shown when the device is `IN_STOCK`/`DEFECTIVE`; the page owns
  the inspection dialog (QC page).
- `onSell` — shown when the device is `IN_STOCK`; the page owns the handler
  (inventory page pushes to the cart and navigates to POS). The QC page omits it.
Also renders a barcode strip, a copy-IMEI header and a margin card.

Permissions (`device.cost.view`, `device.status.change`, `device.update`,
`device.expense`, `customs.manage`) are read from the auth store inside the widget.

## Must never
- Hold server data in local state or call repositories directly (hooks only).
- Render native form/table controls — use `shared/ui`.
