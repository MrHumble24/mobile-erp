# devices

Owns the per-unit lifecycle of `devices`: query, specs/price edits, status
transitions and status history. Intake (creation + landed cost) belongs to
`shipments`.

## Exposes (REST `/devices`)

- `GET /` — filter `imei|modelId|storage|statusCode|search`, paginated
  `{ items, total, page, pageSize }` (`device.read`).
- `GET /by-imei/:imei` — POS lookup: device + model + status + latest QC
  summary (`device.read`).
- `GET /:id`, `GET /:id/history` (`device.read`).
- `PATCH /:id` — `{ specs?, targetPrice? }` (`device.update`). When `specs` is
  present it is validated against the device model's attribute schema
  (`DeviceModelsService.getAttributes` + `validateSpecs`); failures → 400
  `{ message: 'Invalid specs', problems: [{ key, message }] }`.
- `POST /:id/status` — `{ toStatusCode, reason?, expectedVersion }`
  (`device.status.change`). 409 on version mismatch (offline lock).

## Public API (for later waves)

`DevicesService.changeStatus(deviceId, toStatusCode, userId, reason?,
expectedVersion?)` — transition guard + version-locked update + history, in one
transaction. Sales/consignment inject `DevicesService`. Transitions are
data-driven in `types/status-transitions.ts`.

## Must never

- Expose `acquisitionCost`/`landedCost` unredacted (money is string; the cost
  interceptor strips by key).
- Allow a transition absent from the transition table.
