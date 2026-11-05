# 0031 — POS catalog, product pictures and code lookup

Date: 2026-11-05
Status: Accepted

## Context

The till only sold by scanned/typed code. The client wants a shop-like grid of
product cards with pictures, and intake that fills model/colour/storage from a
typed IMEI or box code (Change 5; not yet in the PRD — the user owns that file).
A phone sale stays tied to one IMEI/serial.

## Decision

- **Pictures.** `DeviceModel.imageFileName` holds only a server-generated random
  name; the bytes live under `UPLOADS_DIR` (default `./uploads`, git-ignored,
  created on start). `POST`/`DELETE /device-models/:id/image` (both
  `device.update`, multipart, one `file`): the type is decided by the leading
  bytes (JPEG/PNG/WebP), ≤ 2 MB, never the name/declared type
  (`lib/image-file.ts`). Replace/remove deletes the old file. Served public,
  read-only, cross-origin from `/uploads` with a 1-year immutable cache and
  `nosniff` (an `<img>` carries no token); helmet/CORS stay global. Every
  model-carrying response gains `imageUrl`. On Railway `UPLOADS_DIR` must be a
  mounted volume. No new dependency (multer ships with platform-express); no
  resizing.
- **Catalog.** A read-model `catalog` module (like `reports`, it reads the
  device/stock tables directly): `GET /catalog` (`device.read`, `?categoryId
  &search` on name/modelCode/storage) returns one card per IMEI/SERIAL product
  with ≥1 IN_STOCK unit (count + min/max target price) and one per active
  QUANTITY product (summed quantity, may be ≤ 0, + salePrice);
  `GET /catalog/:modelId/units` returns the IN_STOCK units (code, specs, latest
  QC grade, target price). "Sellable" = `statusCode = IN_STOCK`, so
  consigned/sold/defective drop out. The offline changes feed now carries
  `imageUrl` + `categoryId` on model rows.
- **Lookup.** Reference tables in `reference.prisma` (`ref_apple_box_codes`,
  `ref_imei_tacs`) loaded by `pnpm ref:import` (replaces, idempotent, not in the
  migration — too big). `GET /lookup?code=` (`device.read`) → an Apple box code
  (region suffix/case/spaces stripped to the 5-char base) or a 15-digit IMEI
  (→ 8-digit TAC); 404 otherwise. It also names our product in order: a learned
  link, else `modelCode == code`, else brand+name equal ignoring case/spacing/a
  leading brand word; and returns the product's matching storage/color option.
  Learned links (`ref_model_links`, one per reference model, replaced on
  re-teach) via `POST /lookup/links` (`device.update`). The answer's `source`
  credits The Apple Wiki (CC BY-SA) / TAC (MIT).

## Consequences

- No new permission code — pictures/learning reuse `device.update`, reads reuse
  `device.read`. The catalog reads cross-module tables by SQL (read-model
  pattern); quantity summation stays trivial, valuation stays in `stock`.
- Samsung colour/memory lookup is deliberately out (no trustworthy free source).
