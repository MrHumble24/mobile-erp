# shipments

Owns the `shipments` table and IMEI intake into a batch. A shipment has no
expense of its own (ADR 0026, supersedes ADR 0006): each phone carries its own
`unitExpense`; per-unit lifecycle and the landed-cost formula live in `devices`.

## Exposes (REST `/shipments`)

- `GET /`, `GET /:id` — includes `deviceCount` and the computed, cost-restricted
  `unitExpenseTotal` (sum of its devices' `unitExpense`, never stored)
  (`shipment.read`).
- `POST /` — create `{ supplierId, shipmentDate, expectedCount,
  paymentAccountCode?, notes? }` (`shipment.manage`). 404 if supplier missing.
  `paymentAccountCode` (default CASH, must be active) is **fixed after creation**
  and is the account every purchase + per-device expense posts against. Response
  carries `paymentAccountCode`.
- `PATCH /:id` — edit `shipmentDate`/`expectedCount`/`notes` only (not
  `paymentAccountCode`); posts no ledger row (`shipment.manage`).
- `POST /:id/devices` — register one or many units
  `{ devices: [{ imei(15 digits), imei2?(15 digits), modelId, specs,
  acquisitionCost, targetPrice?, unitExpense?, unitExpenseNote? }] }`
  (`device.create`). Each unit starts `IN_STOCK` with a history row
  (`fromStatusCode: null`); its landed cost is `acquisitionCost + customsFee +
  unitExpense` (ADR 0026). One `PURCHASE` row posts per device, and a
  `DEVICE_EXPENSE` row when `unitExpense > 0`, both from the shipment's account
  in one transaction (ADR 0025/0026). A non-zero `unitExpense` on any unit needs
  `device.expense` → 403 otherwise. `imei2` is the optional dual-SIM second
  IMEI: it must differ from the unit's `imei` (400) and no value may collide —
  within the batch or against either IMEI column of an existing device — → 409.
  Returns `RegisteredDeviceView[]` (each carries `imei2`, `unitExpense`,
  `landedCost`). Each unit's `specs` is validated against its model's attribute
  schema; failures → 400 `{ message: 'Invalid specs', problems: [{ imei, key,
  message }] }`.

## Must never

- Change a device's status after intake — that is `DevicesService`.
- Expose `unitExpenseTotal`/`landedCost` unredacted (money is string).
