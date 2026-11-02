# feature: edit-device

Edits an in-stock device's editable attributes.

## Owns
- `EditDeviceDialog` — shadcn `Dialog` + `Form` editing the device's `specs`
  via `DynamicSpecFields` (driven by the device model's attribute schema) plus
  `targetPrice`. A 400 `{ problems }` maps field errors by key.
- `edit-device.schema.ts` — zod schema; `specs` is a string record, `targetPrice`
  a numeric string mapped to `number | null` on submit.

## Public API
- `EditDeviceDialog` ({ device, open, onOpenChange }).

## Uses
- `entities/device`: `useUpdateDevice` (invalidates lists + detail + by-imei),
  `DeviceView`, `UpdateDeviceDto`.
- `entities/device-model`: `useDeviceModelAttributes`, `DynamicSpecFields`.

## Must never
- Call HTTP directly or import another feature.
- Change device status (that is a separate concern, see the inventory drawer).

## Gating
- Caller must gate rendering behind the `device.update` permission.
