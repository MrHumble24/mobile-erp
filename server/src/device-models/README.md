# device-models

Owns the `device_models` catalog (brand + name), independent of any unit.

## Exposes (REST `/device-models`)

- `GET /` — list, brand+name ordered (`device.read`).
- `GET /:id` — one model (`device.read`).
- `POST /` — create `{ brand, name }` (`device.update`). Duplicate `(brand, name)` → 409.
- `PATCH /:id` — edit `brand`/`name`/`isActive` (`device.update`). Duplicate → 409.

## Must never

- Hold per-unit data (specs, price, status) — that is the `devices` module.
