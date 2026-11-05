# lookup

Device-code lookup for intake (ADR 0031, Change 5). Identifies a scanned/typed
code from the free reference lists and, when it can, names our catalog product
for it so the intake form preselects model/colour/storage. Owns the reference
tables (`reference.prisma`): `ref_apple_box_codes`, `ref_imei_tacs` (loaded by
`pnpm ref:import`) and `ref_model_links` (learned). Product data comes from
`DeviceModelsService` (injected) — this module never queries `device_models`.

## Exposes (REST `/lookup`)

- `GET /?code=` (`device.read`) → `LookupResult` or 404:
  - an Apple box code (region suffix/case/spaces stripped to its 5-char base,
    e.g. `mu793ll/a` → `MU793`): brand, model, colour, storage, RAM;
  - else a 15-digit IMEI (→ its 8-digit TAC): brand + model;
  - `source` credits the list (Apple Wiki CC BY-SA / TAC MIT).
  - `product` is our catalog product, found in order: a learned **link**, else a
    product whose `modelCode` equals the code, else brand+name equal to the
    reference ignoring case, spacing and a leading brand word. When found,
    `storageOption`/`colorOption` give the product's own option matching the
    reference value (compared ignoring case/spaces), else null. `code` is a
    query param so a box code's `/` needs no path encoding.
- `POST /links` (`device.update`) `{ refBrand, refModel, modelId }` → stores the
  link. One per reference model (keyed by lower/de-spaced `brand|model`); storing
  again replaces it. Validates `modelId` exists (404 otherwise).

## Structure

- `lib/code-normalize.ts` — `imeiTac`, `boxCodeKey` (pure).
- `lib/product-match.ts` — `modelMatchKey`, `linkKey`, `matchAttributeOption` (pure).

## Must never

- Query `device_models` directly — inject `DeviceModelsService`.
- Load the Samsung colour/memory or picture lists (ADR 0031: not trustworthy).
