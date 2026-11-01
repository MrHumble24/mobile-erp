# suppliers

Owns the `suppliers` table (procurement source of shipments).

## Exposes (REST `/suppliers`)

- `GET /` — list all, name-ordered (`shipment.read`).
- `GET /:id` — one supplier (`shipment.read`).
- `POST /` — create (`shipment.manage`).
- `PATCH /:id` — edit fields; `isActive: false` soft-disables (`shipment.manage`).

No hard delete: a supplier with history is disabled, never removed.

## Must never

- Expose shipment/device data — join those via their own modules.
