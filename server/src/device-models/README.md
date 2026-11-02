# device-models

Owns the `device_models` catalog (brand + name), independent of any unit.

Each model also carries an `attributes` JSONB schema (the spec fields its
devices may have). Validation of that schema lives in `lib/attribute-schema.ts`.

## Exposes (REST `/device-models`)

- `GET /` — list, brand+name ordered, each with `attributes` (`device.read`).
- `GET /:id` — one model incl. `attributes` (`device.read`).
- `GET /:id/attributes` — just the `AttributeDef[]` for dynamic forms (`device.read`).
- `POST /` — create `{ brand, name, attributes? }` (`device.update`). Omit
  `attributes` → seeded with default `storage`(required) + `color` selects.
  Duplicate `(brand, name)` → 409.
- `PATCH /:id` — edit `brand`/`name`/`isActive`/`attributes` (`device.update`).
  Replacing `attributes` re-injects the reserved `storage` select. Duplicate → 409.

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
