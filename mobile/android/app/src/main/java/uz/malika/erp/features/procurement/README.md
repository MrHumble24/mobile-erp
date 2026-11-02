# features/procurement — Shipments, Suppliers & QC (native Android)

Ports the web `pages/shipments`, `pages/qc` and their features. One slice,
two nav items; Suppliers is a tab inside Shipments (no nav of its own).

## Owns
- Suppliers CRUD; shipments list/detail with landed cost (ADR 0006).
- Device intake: batch IMEI scanning (`ScannerField`), 15-digit + required-spec
  validation, client-side duplicate block, landed-cost allocation server-side.
- QC: queue (`/devices?inspected=false`), grade-device inspections (defects,
  battery, redaction-gated repair cost), stats, and lookup management (ADR 0014).
- Pagination (load-more via the kit `PageState`/`LoadMoreFooter`) on the QC
  queue, inspections and shipment devices; inspections filter by pass/fail; QC
  stats take presets + a custom range (`AppDateRangeField`).
- Post-intake landed-cost summary (per-device, `device.cost.view` only) and a
  grade-save toast (`container.toaster`). Shipments use a tablet master-detail
  pane (≥720dp) via `BoxWithConstraints`; incoming `qc` arg (device sheet
  → "Run QC") opens the grade sheet via `featureNav.consumeArg`.

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

## Missing i18n keys (Gemini handoff — raw key shows until added)
- `qc.dateRange`, `shipments.selectShipment`; kit-wide: `common.loadMore`,
  `common.offline`.

## Open questions
- `ProcurementService` runs on a second HTTP client because the wave-0
  `ApiService` cannot be edited; promote these routes onto it and delete
  `data/ProcurementApi.kt`'s factory.
