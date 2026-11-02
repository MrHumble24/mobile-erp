# feature: grade-device

Records a QC inspection. `GradeDeviceDialog({ imei, open, onOpenChange,
onInspectNext })` resolves the device by IMEI itself (via `useDeviceByImei`), so
any scanned IMEI works — not just a loaded row.

## Flow
- Not found → not-found state; status not `IN_STOCK`/`DEFECTIVE` → not-inspectable.
- Form (shadcn `Form` + react-hook-form + zod in `model/`): device header,
  pass/fail segmented control, grade `Select` (from `/qc/grades`), battery 0–100
  with a bar, defect checklist (per-defect notes), repair cost (gated by
  `device.cost.view`), notes.
- Validation mirrors the server: a fail needs ≥1 defect.
- On save: toast with the resulting device status; `useCreateInspection`
  invalidates device lists, QC lists and stats. "Inspect next" closes and calls
  `onInspectNext` (the page refocuses the scanner).

## Must never
- Hardcode grades/defects — always from the lookups.
- Call HTTP directly or hold server data in local state (hooks only).
