# 0014 — QC management screen (server + client)

Date: 2026-11-02
Status: Accepted

## Context

`/qc` was a thin inspect-the-loaded-rows screen. PRD Module 2 needs a full
quality-control workspace: a queue of uninspected devices, an inspection
history, aggregate stats, and runtime management of the defect/grade lookups.

## Decision

- **Lookups managed at runtime.** `defect_types` and `cosmetic_grades` stay
  lookup tables (no enums). `settings.manage` can create (`POST`) and edit
  (`PATCH`) them; codes are UPPER_SNAKE and immutable. There is no DELETE — a
  lookup referenced by inspections is deactivated (`isActive=false`), which
  hides it from the inspection dialog but preserves history.
- **A failed inspection requires ≥1 defect** (400). Battery health is 0–100.
- **Inspectable statuses are `IN_STOCK` and `DEFECTIVE`** only (409 otherwise);
  fail/pass still flips the device between them via `DevicesService`.
- **Stats are pure aggregates.** `GET /qc/stats` runs one groupBy/count/avg per
  field — no row loops. `passRate` is passed/inspected (0–1).
  `awaitingInspection` = in-stock/defective devices with no inspection, owned by
  `DevicesService.countAwaitingInspection()` so QC never queries the devices
  table.
- **Three concerns, three pairs** in the qc module (inspections / lookups /
  stats) to keep every file single-responsibility and under the size limit.
- Devices list gains `inspected=true|false` and a `latestInspection` summary on
  each row (reusing the by-imei inspection select), powering the QC queue.

## Consequences

- Adding a defect type or grade is a data change, not a deploy.
- The queue filters server-side (`inspected=false`), so a scanned IMEI that is
  not on the current page still resolves via `useDeviceByImei`.
- `repairCostEstimate` remains redacted by key via the cost interceptor.
