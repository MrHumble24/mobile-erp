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
  customsCode?, salePrice?, attributes? }` (`device.update`). `kindCode` defaults to `IMEI`
  (must be an active `product_kinds` row, else 400). `categoryId` is validated
  (404 if missing). Omit `attributes` → seeded with default `storage`(required)
  + `color` selects. Duplicate `(brand, name)` → 409; duplicate `barcode` → 409.
- `PATCH /:id` — edit `brand`/`name`/`isActive`/`kindCode`/`categoryId`/`barcode`/
  `modelCode`/`customsCode`/`attributes` (`device.update`). `kindCode` may change
  only while the model has **no units** (else 409). `null` clears `categoryId`/
  `barcode`/`modelCode`/`customsCode`. Replacing `attributes` re-injects the
  reserved `storage` select. Duplicate name/barcode → 409.
- `POST /:id/image` — multipart, one field `file` (`device.update`). Accepts a
  JPEG/PNG/WebP decided by the leading bytes (not the name/declared type),
  ≤ 2 MB; stores it under `UPLOADS_DIR` with a random name, points the model at
  it and deletes the previous file. 400 on a non-image/empty, 413 over 2 MB.
- `DELETE /:id/image` — removes the picture and deletes the file (`device.update`).
- `POST /:id/colors/:color/image` — multipart, one field `file` (`device.update`).
  Sets or replaces the optional picture for a specific color variant (ADR 0066).
- `DELETE /:id/colors/:color/image` — removes the color picture and deletes the
  file (`device.update`).

Every model response carries `imageUrl` and `colorImages` (map of color -> `/uploads/...` URL)
— the file names themselves stay internal (ADR 0031, ADR 0066).
Pictures are served public + read-only + cross-origin from `/uploads` (mounted
in `main.ts`), so an `<img>` on another origin loads them with no token. File
I/O and the magic-byte check live in `image-storage.service.ts` /
`lib/image-file.ts`.

`kindCode` (IMEI | SERIAL | QUANTITY) says how the model's units are stocked
(ADR 0029). `barcode` is the box EAN (used later for quantity scanning);
`modelCode` is the maker's code (Apple `A2894`, Samsung `SM-S918B`), indexed for
search. `customsCode` is how customs writes this model; the customs module
stamps a phone's fee from it at intake (ADR 0027). `salePrice` (optional money,
2-dp string in responses) is the default till price per piece for a `QUANTITY`
product (ADR 0030); `null` clears it. `PATCH` also accepts `salePrice`.

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
- Put a client-supplied name or path on disk — file names are server-generated,
  only the one `UPLOADS_DIR` is exposed, no traversal (ADR 0031).
