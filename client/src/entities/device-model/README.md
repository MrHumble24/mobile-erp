# entity: device-model

The product catalog (brand + name + active + kind), its category/barcode/model
code (ADR 0029) and its per-model spec schema.

## Owns
- `DeviceModelView`, `CreateDeviceModelDto`, `UpdateDeviceModelDto` — incl.
  `kindCode` (`IMEI | SERIAL | QUANTITY`, `ProductKind`), `categoryId`, `barcode`,
  `modelCode`, `customsCode` (ADR 0027), `salePrice` (default till price per
  piece for a QUANTITY product, 2-dp string; ADR 0030), and `imageUrl` (the
  product picture's `/uploads/...` path or null, ADR 0031), `colorImages`
  (map of color name -> image URL, ADR 0066), plus `AttributeDef`.
- `lib/product-kind.ts` — `PRODUCT_KINDS` (code + label/hint i18n keys, form
  order) and `productKindLabelKey(code)`.
- `device-model.repository.ts` — the only HTTP caller for `/device-models`.
- `device-model.keys.ts` — query-key factory.
- `useDeviceModels`, `useCreateDeviceModel`, `useUpdateDeviceModel`,
  `useUploadDeviceModelImage`, `useRemoveDeviceModelImage`,
  `useUploadDeviceModelColorImage`, `useRemoveDeviceModelColorImage` (multipart via
  `shared/api/http`'s `uploadFile`). `ACCEPTED_IMAGE_TYPES` + `MAX_IMAGE_BYTES`
  mirror the server's checks for an early client-side guard (ADR 0031).
- `useDeviceModelAttributes(modelId)` — the model's `AttributeDef[]`, read from
  the cached list (no extra request).
- `DynamicSpecFields` — renders one react-hook-form field per attribute (sorted
  by `sortOrder`): `select` → `Combobox`, `number`/`text` → `Input`; required
  marker; shows server `{ key, message }` problems under the matching field.
- `UsedUnitFields` + `lib/used-unit.ts` (`UsedUnitValues`, `emptyUsedUnit`,
  `usedUnitToPayload`, `usedUnitReady`) — the model picker + specs + IMEI/serial
  fields for entering a used unit, shared by `features/buy-phone` and the till's
  trade-in (ADR 0039). Generic over a form whose values extend `UsedUnitValues`.

## Public API
Everything in `index.ts`. Never deep-import.

## Must never
- Hold per-unit device data (that is `entities/device`).
- Call HTTP outside the repository or use React Query outside the hooks.
