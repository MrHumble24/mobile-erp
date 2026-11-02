# features/procurement — Shipments, Suppliers & QC (native Android)

Ports the web `pages/shipments`, `pages/qc` and their features. One slice,
two nav items; Suppliers is a tab inside Shipments (no nav of its own).

## Owns
- Suppliers CRUD; shipments list/detail with landed cost (ADR 0006).
- Device intake: batch IMEI scanning (`ScannerField`), 15-digit + required-spec
  validation, client-side duplicate block, landed-cost allocation server-side.
- QC: queue (`/devices?inspected=false`), grade-device inspections (defects,
  battery, redaction-gated repair cost), stats, and lookup management (ADR 0014).

## Public API
- `ProcurementFeature` — the only export the app registers (one line in
  `FeatureRegistry`). Everything else is internal to the slice.

## Must never
- Import another feature slice (it reads devices/models via its own repository).
- Queue writes to the outbox — every write here is online-only and blocks with
  `common.offline` when offline (only sale/consignment may use the outbox).
- Model or cache cost fields when absent (redacted for non-`device.cost.view`).
- Render raw Material with default styling — only the Caldera kit + the two
  slice-local primitives (`AppSelect`, `AppDateField`) built from Tokens.

## Open questions
- `ProcurementService` runs on a second HTTP client because the wave-0
  `ApiService` cannot be edited; promote these routes onto it and delete
  `data/ProcurementApi.kt`'s factory.
- No snackbar host is exposed to routes, so write success is shown by the
  refreshed list / dismissed sheet rather than a toast.
