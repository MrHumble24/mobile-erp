# feature: edit-device

Edits an in-stock device's editable attributes.

## Owns
- `EditDeviceDialog` — shadcn `Dialog` + `Form` (react-hook-form + zod) editing
  `specs.storage/color/ram/condition` and `targetPrice`.
- `edit-device.schema.ts` — zod schema; `targetPrice` is a numeric string, mapped
  to `number | null` on submit.

## Public API
- `EditDeviceDialog` ({ device, open, onOpenChange }).

## Uses
- `entities/device`: `useUpdateDevice` (invalidates lists + detail + by-imei),
  `STORAGE_OPTIONS`, `DeviceView`, `UpdateDeviceDto`.

## Must never
- Call HTTP directly or import another feature.
- Change device status (that is a separate concern, see the inventory drawer).

## Gating
- Caller must gate rendering behind the `device.update` permission.
