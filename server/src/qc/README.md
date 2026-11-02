# qc

Owns `qc_inspections` and `qc_defects`, plus full management of the QC lookups
(`defect_types`, `cosmetic_grades`). Inspections drive device status via
`DevicesService`. Three concerns, three service/repository pairs:
`QcService` (inspections), `QcLookupsService` (lookups), `QcStatsService`.

## Exposes (REST `/qc`)

- `POST /inspections` (`qc.create`) — `{ deviceId, passed, gradeCode?,
  batteryHealth?, repairCostEstimate?, notes?, defects: [{ defectCode, notes? }] }`.
  Records the inspection; a fail on `IN_STOCK` → `DEFECTIVE`, a pass on
  `DEFECTIVE` → `IN_STOCK` (reason "QC"). Rules: a fail needs ≥1 defect (400),
  battery 0–100 (400), device must be `IN_STOCK`/`DEFECTIVE` (409), unknown
  grade/defect code (400).
- `GET /inspections` (`qc.read`) — paginated `{ items, total, page, pageSize }`;
  filters `deviceId|imei|passed|gradeCode|defectCode|inspectedById|from|to`,
  `page`, `pageSize`. Each item adds `device` and `inspectedBy { id, name }`.
- `GET /stats?from&to` (`qc.read`) — `{ inspected, passed, failed, passRate
  (0–1), byGrade, topDefects, avgBatteryHealth, awaitingInspection }`. One
  aggregate query per field; `awaitingInspection` comes from
  `DevicesService.countAwaitingInspection()`.
- `GET /defect-types`, `GET /grades` (`qc.read`) — active lookups;
  `?includeInactive=true` returns all.
- `POST /defect-types`, `POST /grades` (`settings.manage`) — `{ code
  (UPPER_SNAKE), label, sortOrder? }`; 409 on duplicate code.
- `PATCH /defect-types/:code`, `PATCH /grades/:code` (`settings.manage`) —
  `{ label?, sortOrder?, isActive? }`. No DELETE: referenced lookups deactivate.

## Must never

- Mutate device status directly — always `DevicesService.changeStatus`.
- Query the `devices` table from a QC repository — go through `DevicesService`.
- Expose `repairCostEstimate` unredacted (money is string; cost interceptor).
