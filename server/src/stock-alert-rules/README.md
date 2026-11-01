# stock-alert-rules

Owns `stock_alert_rules`: a low-stock threshold per `(modelId, storage)`.

## Exposes (REST `/stock-alert-rules`)

- `GET /low-stock` — rules currently breached, each with its live `currentCount`
  of `IN_STOCK` devices for that model + storage (`device.read`).
- `GET /`, `GET /:id` (`device.read`).
- `POST /` — `{ modelId, storage, threshold }` (`settings.manage`). 404 if model
  missing; duplicate `(modelId, storage)` → 409.
- `PATCH /:id` — `{ storage?, threshold? }` (`settings.manage`). Duplicate → 409.

## Must never

- Store the current count — it is always derived from `devices` at query time.
