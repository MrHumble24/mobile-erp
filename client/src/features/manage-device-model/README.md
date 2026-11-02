# feature: manage-device-model

CRUD for device models (brand + name + active flag).

## Owns
- `DeviceModelsPanel` — table of models + "new" button + edit action.
- `DeviceModelDialog` — shadcn `Form` create/edit; a 409 from the server surfaces
  as a duplicate-name field error.
- `AttributeEditor` / `AttributeRow` / `OptionsChipsEditor` — the per-model spec
  schema editor: add/reorder/remove attributes (label, auto-slugged key, type,
  required, select options as chips). The reserved `storage` attribute is shown
  locked (key + type not editable, cannot be removed; options editable).
- `device-model-form.schema.ts` — zod schema mirroring the server rules
  (`slugKey`, unique keys) plus `toDtoAttributes`/`toFormAttributes` mappers.

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
