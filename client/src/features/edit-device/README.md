# feature: edit-device

Edits an in-stock device's editable attributes.

## Owns
- `EditDeviceDialog` — shadcn `Dialog` + `Form` editing the device's `specs`
  via `DynamicSpecFields` (driven by the device model's attribute schema) plus
  `targetPrice` and a "Dual SIM" `Switch` that reveals `imei2`. The toggle
  defaults on when the device already has an `imei2`; turning it off clears the
  field and sends `null`. A 400 `{ problems }` maps field errors by key.
- `edit-device.schema.ts` — `buildEditDeviceSchema(primaryImei, t)` zod factory;
  `specs` is a string record, `targetPrice` a numeric string → `number | null`,
  `dualSim` a boolean (form-only, not persisted), `imei2` 15 digits distinct from
  the primary IMEI and required when `dualSim` is on → `string | null`.

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
