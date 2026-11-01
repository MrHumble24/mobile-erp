# qc

Owns `qc_inspections` and `qc_defects`, plus read access to the QC lookups
(`defect_types`, `cosmetic_grades`). Inspections drive device status via
`DevicesService`.

## Exposes (REST `/qc`)

- `POST /inspections` — `{ deviceId, passed, gradeCode?, batteryHealth?,
  repairCostEstimate?, notes?, defects: [{ defectCode, notes? }] }`
  (`qc.create`). Records the inspection; a fail on an `IN_STOCK` device moves it
  to `DEFECTIVE`, a pass on a `DEFECTIVE` device moves it back to `IN_STOCK`
  (reason "QC"). Unknown grade/defect code → 400.
- `GET /inspections?deviceId=` — latest-first (`qc.read`).
- `GET /defect-types`, `GET /grades` — active lookups (`qc.read`).

## Must never

- Mutate device status directly — always through `DevicesService.changeStatus`.
- Expose `repairCostEstimate` unredacted (money is string).
