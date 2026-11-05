# entity: device-model

The product catalog (brand + name + active + kind), its category/barcode/model
code (ADR 0029) and its per-model spec schema.

## Owns
- `DeviceModelView`, `CreateDeviceModelDto`, `UpdateDeviceModelDto` — incl.
  `kindCode` (`IMEI | SERIAL | QUANTITY`, `ProductKind`), `categoryId`, `barcode`,
  `modelCode`, and `customsCode` (ADR 0027), plus `AttributeDef`.
- `lib/product-kind.ts` — `PRODUCT_KINDS` (code + label/hint i18n keys, form
  order) and `productKindLabelKey(code)`.
- `device-model.repository.ts` — the only HTTP caller for `/device-models`.
- `device-model.keys.ts` — query-key factory.
- `useDeviceModels`, `useCreateDeviceModel`, `useUpdateDeviceModel`.
- `useDeviceModelAttributes(modelId)` — the model's `AttributeDef[]`, read from
  the cached list (no extra request).
- `DynamicSpecFields` — renders one react-hook-form field per attribute (sorted
  by `sortOrder`): `select` → `Combobox`, `number`/`text` → `Input`; required
  marker; shows server `{ key, message }` problems under the matching field.

## Public API
Everything in `index.ts`. Never deep-import.

## Must never
- Hold per-unit device data (that is `entities/device`).
- Call HTTP outside the repository or use React Query outside the hooks.
