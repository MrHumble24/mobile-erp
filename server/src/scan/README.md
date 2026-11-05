# scan

One scan lookup for the till (ADR 0030). Takes any scanned or typed code and
answers with the unit it identifies or the quantity product it is the barcode
of. Owns no tables — it composes `DevicesService` and `StockService`.

## Exposes (REST `/scan`)

- `GET /:code` (`device.read`) → one of:
  - `{ kind: 'unit', unit: DeviceDetailView }` — the code matched an IMEI,
    second IMEI or serial (ADR 0029 lookup); **units win** over barcodes.
  - `{ kind: 'product', product: { modelId, brand, name, barcode, salePrice,
    quantity, categoryId, imageUrl } }` — the code is a `QUANTITY` product's
    barcode, with its current stock (may be negative), default price and the
    grid fields `categoryId`/`imageUrl` (ADR 0031).
  - `404` when the code is neither.

## Must never

- Inject another module's repository (uses `DevicesService` + `StockService`).
