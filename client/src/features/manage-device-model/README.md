# feature: manage-device-model

CRUD for device models (brand + name + active flag).

## Owns
- `DeviceModelsPanel` — table of models + "new" button + edit action.
- `DeviceModelDialog` — shadcn `Form` create/edit; a 409 from the server surfaces
  as a duplicate-name field error.
- `device-model-form.schema.ts` — zod schema.

## Public API
- `DeviceModelsPanel` (no props; self-contained).

## Uses
- `entities/device-model`: `useDeviceModels`, `useCreateDeviceModel`,
  `useUpdateDeviceModel`.

## Must never
- Call HTTP directly or import another feature.

## Gating
- Caller renders this only for `device.update` holders.

## Open questions
- Per-model device count is not shown: no cheap server count endpoint exists.
