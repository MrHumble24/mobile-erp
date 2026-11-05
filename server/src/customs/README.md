# customs

Owns customs price-list versions and the per-phone customs fee rule (ADR 0027).
A phone's fee is stamped at intake from the current list and frozen; the device
column and the hand-fix live in `devices`. No Excel upload yet — this is the
data model + JSON API it will sit on later.

## Owns

- `customs_price_lists` and `customs_price_list_items` (append-only versions;
  never edited or deleted). The current list is the newest `effectiveAt`.
- `CustomsService.currentFeeMap()` — `customsCode -> fee`, injected by
  `shipments` to stamp `Device.customsFee` at intake (never the repository).

## Exposes (REST `/customs/price-lists`)

- `POST /` — `{ effectiveAt?, note?, items: [{ customsCode, description?, fee }] }`
  (`customs.manage`). Duplicate `customsCode` in one payload → 400. Returns
  `{ id, effectiveAt, note, createdById, createdAt, itemCount }`.
- `GET /` — every version, newest first, each a summary as above (`customs.read`).
- `GET /current` — `{ id, effectiveAt, note, items: [{ customsCode, description,
  fee, previousFee, usedByModel }] }` or `null` (`customs.read`). `previousFee`
  is the prior version's fee for the same code; `usedByModel` is true when a
  device model carries that code.
- `GET /unmatched-models` — active models with no `customsCode` or a code absent
  from the current list: `[{ id, brand, name, customsCode, reason }]`, reason
  `MISSING_CODE | CODE_NOT_IN_CURRENT_LIST` (`customs.read`).
- `GET /fees/:customsCode/history` — `[{ listId, effectiveAt, fee }]`, oldest
  first, for a trend chart (`customs.read`).

The hand fix is on the devices resource: `PATCH /devices/:id/customs-fee`
(`customs.manage`) posts the CUSTOMS difference; see `devices`.

## Must never

- Edit or delete a price-list version, or recompute an already-stamped phone's
  fee when a new list arrives. Fees are read only at intake.
