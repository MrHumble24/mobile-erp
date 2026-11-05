# device-models

Owns the `device_models` catalog (brand + name + kind), independent of any unit.
The Prisma model lives in `prisma/schema/catalog.prisma` with `product_kinds`
and `product_categories` (ADR 0029).

Each model also carries an `attributes` JSONB schema (the spec fields its
devices may have). Validation of that schema lives in `lib/attribute-schema.ts`.

## Exposes (REST `/device-models`)

- `GET /` — list, brand+name ordered, each with `attributes`, `kindCode`,
  `categoryId`, `barcode`, `modelCode`, `customsCode` (`device.read`).
- `GET /:id` — one model, same fields (`device.read`).
- `GET /:id/attributes` — just the `AttributeDef[]` for dynamic forms (`device.read`).
- `POST /` — create `{ brand, name, kindCode?, categoryId?, barcode?, modelCode?,
  customsCode?, attributes? }` (`device.update`). `kindCode` defaults to `IMEI`
  (must be an active `product_kinds` row, else 400). `categoryId` is validated
  (404 if missing). Omit `attributes` → seeded with default `storage`(required)
  + `color` selects. Duplicate `(brand, name)` → 409; duplicate `barcode` → 409.
- `PATCH /:id` — edit `brand`/`name`/`isActive`/`kindCode`/`categoryId`/`barcode`/
  `modelCode`/`customsCode`/`attributes` (`device.update`). `kindCode` may change
  only while the model has **no units** (else 409). `null` clears `categoryId`/
  `barcode`/`modelCode`/`customsCode`. Replacing `attributes` re-injects the
  reserved `storage` select. Duplicate name/barcode → 409.

`kindCode` (IMEI | SERIAL | QUANTITY) says how the model's units are stocked
(ADR 0029). `barcode` is the box EAN (used later for quantity scanning);
`modelCode` is the maker's code (Apple `A2894`, Samsung `SM-S918B`), indexed for
search. `customsCode` is how customs writes this model; the customs module
stamps a phone's fee from it at intake (ADR 0027).

## Attribute schema (`lib/attribute-schema.ts`)

- `AttributeDef { key, label, type: text|number|select, options, required, sortOrder }`.
- `normalizeAttributes` slugs keys to `[a-z][a-zA-Z0-9]*`, dedupes, trims options,
  defaults sortOrder, and injects the reserved `storage` select (type locked —
  reports + stock alerts group on `specs->>'storage'`).
- `validateSpecs(attributes, specs)` returns `{ key, message }[]`; strict on
  unknown keys unless the model has an empty schema (legacy → accept anything).
  Consumed by `shipments` (intake) and `devices` (edit).

## Must never

- Hold per-unit data (specs values, price, status) — that is the `devices` module.
- Change the reserved `storage` key's type.
