# add-stock-to-shipment

Buying quantity products into a shipment (ADR 0030) — `POST /shipments/:id/items`
(permission `device.create`). Money leaves the shipment's fixed "paid from"
account, which the dialog shows.

## Exposes

- `AddStockDialog` — stage lines (product, quantity, cost per piece, with each
  line total and the grand total), then post them in one request. `onAdded`
  returns the purchased lines so the shipment detail can list them.

## Must never

- Let a non-`QUANTITY` model be chosen (the product list is pre-filtered; the
  server also rejects it 400).

## Known gap

The server has no `GET` for a shipment's quantity lines, so the detail only
shows lines added in the current session. A `GET /shipments/:id/items` (or a
movements-by-shipment read) would make them survive a reload.
