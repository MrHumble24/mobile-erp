# shipments

Owns the `shipments` table and IMEI intake into a batch. Landed-cost
allocation lives here (ADR 0006); per-unit lifecycle lives in `devices`.

## Exposes (REST `/shipments`)

- `GET /`, `GET /:id` — includes `deviceCount` (`shipment.read`).
- `POST /` — create `{ supplierId, shipmentDate, expectedCount, overheadCost?,
  notes? }` (`shipment.manage`). 404 if supplier missing.
- `PATCH /:id` — edit fields; changing `overheadCost` recomputes landed cost
  for every device in the batch, in one transaction (`shipment.manage`).
- `POST /:id/devices` — register one or many units
  `{ devices: [{ imei(15 digits), imei2?(15 digits), modelId, specs,
  acquisitionCost, targetPrice? }] }` (`device.create`). Each unit starts
  `IN_STOCK` with a history row (`fromStatusCode: null`); landed cost is
  recomputed for the whole batch atomically. `imei2` is the optional dual-SIM
  second IMEI: it must differ from the unit's `imei` (400) and no value may
  collide — within the batch or against either IMEI column of an existing
  device — → 409. Returns `RegisteredDeviceView[]` (each carries `imei2`).
  Each unit's `specs` is validated against its model's attribute schema
  (`DeviceModelsService.getAttributes` + `validateSpecs`); failures → 400
  `{ message: 'Invalid specs', problems: [{ imei, key, message }] }`.

## Must never

- Change a device's status after intake — that is `DevicesService`.
- Expose `overheadCost`/`landedCost` unredacted (money is string).
