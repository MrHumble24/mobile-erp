# devices

Owns the per-unit lifecycle of `devices`: query, specs/price edits, status
transitions and status history. Intake (creation + landed cost) belongs to
`shipments`.

## Exposes (REST `/devices`)

- `GET /` — filter `imei|modelId|storage|statusCode|search` (`search` matches
  both IMEI columns), plus `inspected=true|false`, paginated
  `{ items, total, page, pageSize }` (`device.read`). Every row carries
  `imei2: string | null` and
  `latestInspection { id, passed, gradeCode, batteryHealth, inspectedAt } | null`.
- `GET /by-imei/:imei` — POS lookup: device + model + status + latest QC
  summary (`device.read`). Matches `imei` **or** `imei2` (dual-SIM units).
- `GET /:id`, `GET /:id/history` (`device.read`).
- `PATCH /:id` — `{ specs?, targetPrice?, imei2? }` (`device.update`). `imei2`
  is a 15-digit optional second IMEI; `null` clears it. It must differ from
  `imei` (400) and not collide with either IMEI column of another unit (409).
  When `specs` is present it is validated against the model's attribute schema
  (`DeviceModelsService.getAttributes` + `validateSpecs`); failures → 400
  `{ message: 'Invalid specs', problems: [{ key, message }] }`.
- `POST /:id/status` — `{ toStatusCode, reason?, expectedVersion }`
  (`device.status.change`). 409 on version mismatch (offline lock).

## Public API (for later waves)

`DevicesService.changeStatus(deviceId, toStatusCode, userId, reason?,
expectedVersion?)` — transition guard + version-locked update + history, in one
transaction. Sales/consignment inject `DevicesService`. Transitions are
data-driven in `types/status-transitions.ts`.

`DevicesService.countAwaitingInspection()` — in-stock/defective devices with no
QC inspection yet; consumed by `QcStatsService`.

`lib/imei.ts` is the one source of IMEI knowledge: `IMEI_REGEX`/`IMEI_MESSAGE`
(every DTO) and `anyImeiWhere(value)` — the `imei = x OR imei2 = x` filter every
by-IMEI lookup across modules (sales, consignment, QC, sync) uses.

## Must never

- Expose `acquisitionCost`/`landedCost` unredacted (money is string; the cost
  interceptor strips by key).
- Allow a transition absent from the transition table.

`GET /devices` also accepts `statusCodes=A,B` (ignored when `statusCode` is set) so the QC queue can
restrict itself to IN_STOCK + DEFECTIVE in one request.
