# devices

Owns the per-unit lifecycle of `devices`: query, specs/price edits, status
transitions and status history. Intake (creation + landed cost) belongs to
`shipments`.

## Exposes (REST `/devices`)

- `GET /` — filter `imei|modelId|storage|statusCode|search` (`search` matches
  both IMEI columns, the serial number and the model's `modelCode`), plus
  `inspected=true|false`, paginated `{ items, total, page, pageSize }`
  (`device.read`). Every row carries `imei: string | null`,
  `imei2: string | null`, `serialNumber: string | null` and
  `latestInspection { id, passed, gradeCode, batteryHealth, inspectedAt } | null`.
- `GET /by-imei/:imei` — POS lookup by any unit code: device + model
  (incl. `kindCode`) + status + latest QC summary + `prices{RETAIL,WHOLESALE,
  PARTNER}` resolved for the unit (ADR 0034) (`device.read`). The `:imei`
  path segment is the scanned/typed code; it matches `imei`, `imei2` **or**
  `serialNumber` (ADR 0029, `lib/unit-code.ts`).
- `GET /:id`, `GET /:id/history` (`device.read`).
- `PATCH /:id` — `{ specs?, targetPrice?, imei2? }` (`device.update`). `imei2`
  is a 15-digit optional second IMEI; `null` clears it. Rejected on a serial
  unit (400). It must differ from `imei` (400) and not collide with either IMEI
  column of another unit (409).
  When `specs` is present it is validated against the model's attribute schema
  (`DeviceModelsService.getAttributes` + `validateSpecs`); failures → 400
  `{ message: 'Invalid specs', problems: [{ key, message }] }`.
- `PATCH /:id/expense` — `{ unitExpense, unitExpenseNote? }` (`device.expense`,
  ADMIN only). Recomputes landed cost (`acquisitionCost + customsFee +
  unitExpense`) and posts the `DEVICE_EXPENSE` **difference** from the device's
  shipment account in one transaction (ADR 0026); zero difference posts nothing.
  A sold phone keeps its sale's `landedCostSnapshot`. `unitExpenseNote: null`
  clears the note. 404 if the device is missing.
- `PATCH /:id/customs-fee` — `{ customsFee }` (`customs.manage`). Hand fix for a
  phone's customs fee: recomputes landed cost and posts the `CUSTOMS`
  difference (ADR 0027); a sold phone keeps its snapshot. 404 if missing.
- `POST /:id/status` — `{ toStatusCode, reason?, expectedVersion }`
  (`device.status.change`). 409 on version mismatch (offline lock).

## Public API (for later waves)

`DevicesService.changeStatus(deviceId, toStatusCode, userId, reason?,
expectedVersion?)` — transition guard + version-locked update + history, in one
transaction. Sales/consignment inject `DevicesService`. Transitions are
data-driven in `types/status-transitions.ts`.

`DevicesService.countAwaitingInspection()` — in-stock/defective devices with no
QC inspection yet; consumed by `QcStatsService`.

`lib/imei.ts` holds IMEI knowledge: `IMEI_REGEX`/`IMEI_MESSAGE` (every DTO) and
`anyImeiWhere(value)` — the `imei = x OR imei2 = x` filter used for IMEI
uniqueness checks at intake/edit.

`lib/unit-code.ts` is the one source for identifying a unit from a scanned or
typed code (ADR 0029): `SERIAL_REGEX`/`SERIAL_MESSAGE`, `normalizeSerial`
(trim + upper-case), `unitCodeWhere(code)` (imei → imei2 → serialNumber, the
filter every by-code lookup across sales/consignment/QC/sync/warranty uses) and
`resolveUnitCode({imei?,serialNumber?})` (exactly one; 400 otherwise).

`lib/landed-cost.ts::computeLandedCost(acquisitionCost, customsFee, unitExpense)`
is the single home of the landed-cost rule (ADR 0026); `shipments` (intake) and
the customs module import it so the formula is never duplicated.

A unit's `shipmentId` is nullable (ADR 0039): a phone bought from a customer has
no shipment. A unit-expense / customs-fee edit on such a unit posts from the
device's own store and CASH (there is no shipment account).

Buy-back (ADR 0044): a **SOLD** unit bought back from a customer is resurrected
in place by `customer-purchases` — the same `devices` row flips SOLD→IN_STOCK
with a status-history row and a fresh `acquisitionCost`/`landedCost`
(customsFee/unitExpense reset to 0), `version += 1`. The old sale keeps its
frozen snapshot. A unit may cycle sold→bought-back many times.

## Must never

- Expose `acquisitionCost`/`landedCost`/`unitExpense`/`customsFee` unredacted
  (money is string; the cost interceptor strips by key).
- Allow a transition absent from the transition table.
- Rewrite a sale's `landedCostSnapshot` when a cost field changes.

`GET /devices` also accepts `statusCodes=A,B` (ignored when `statusCode` is set) so the QC queue can
restrict itself to IN_STOCK + DEFECTIVE in one request.
