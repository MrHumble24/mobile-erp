# feature: manage-device-model

CRUD for products / device models (brand, name, kind, category, barcode, model
code, active, spec schema — ADR 0029).

## Owns
- `DeviceModelsPanel` — table (brand, name, kind, category, active) + a category
  filter + "new" button + edit action.
- `DeviceModelDialog` — shadcn `Form` create/edit. A 409 is routed: a message
  mentioning "kind" → `catalog.kindLocked` on the kind field; otherwise a
  just-entered/changed barcode → `catalog.errorBarcodeExists`, else duplicate name.
- `ModelCatalogFields` — Kind select (with hint), Category select (+ "no
  category"), barcode and model-code inputs, and a `SalePriceField`. For a
  QUANTITY product the dialog shows the price per piece (`salePrice`) and hides
  the customs code and attribute editor (ADR 0030); otherwise it hides the price.
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
  `useUpdateDeviceModel`, `PRODUCT_KINDS`, `productKindLabelKey`.
- `entities/product-category`: `useProductCategories` (filter + category select).

## Must never
- Call HTTP directly or import another feature. Category CRUD lives in the
  sibling feature `manage-product-category`, composed one layer up (inventory).

## Gating
- Caller renders this only for `device.update` holders.

## Open questions
- Per-model unit count is not shown (no cheap server count), so the kind field
  stays editable on edit; the server 409 → `catalog.kindLocked` when it has units.
- Barcode vs name 409 is ambiguous (same server message); the barcode heuristic
  above is a best-effort guess.
