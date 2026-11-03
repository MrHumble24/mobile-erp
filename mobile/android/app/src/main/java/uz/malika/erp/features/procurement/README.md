# features/procurement — Shipments, Suppliers & QC (native Android)

Ports the web `pages/shipments`, `pages/qc` and their features. One slice,
two nav items; Suppliers is a tab inside Shipments (no nav of its own).

## Owns
- Suppliers CRUD; shipments list/detail with landed cost (ADR 0006).
- Device intake: batch IMEI scanning (`ScannerField`), 15-digit + required-spec
  validation, client-side duplicate block, landed-cost allocation server-side.
  A scan never submits a unit: it only FILLS the next empty IMEI slot (IMEI 1,
  then IMEI 2 when Dual SIM is on), checking length alone — a bad length is an
  inline error under that slot and nothing else happens. Once every required slot
  is filled (`imeiSlotsFilled`) **and** model + cost are set, a kit
  `ScanConfirmSheet` opens (both IMEIs in the subtitle) so a mis-read can be
  rejected; confirm adds and clears both IMEI slots while keeping the batch
  defaults (Dual SIM / model / cost) and refocusing IMEI 1, cancel keeps the
  filled slots. A missing model or cost (or spec) shows an inline hint, never an
  error — the operator is never told "IMEI 2 required" while scanning IMEI 1.
  The **Dual SIM** toggle (`inventory.dualSim`, form state, persists across the
  batch) sits inline on the IMEI 1 label row and reveals the second IMEI slot,
  which is then **required** (15 digits, ≠ IMEI). Dual-SIM is derived from
  `imei2`, never stored. The duplicate block spans both IMEIs, and
  `ShipmentDetailSheet` rows show `imei2` as a secondary line.
- QC: queue (`/devices?inspected=false`), grade-device inspections (defects,
  battery, redaction-gated repair cost), stats, and lookup management (ADR 0014).
- Pagination (load-more via the kit `PageState`/`LoadMoreFooter`) on the QC
  queue, inspections and shipment devices. Every QC filter lives in a per-tab
  bottom sheet (kit `FilterSheet`/`FilterButton`): inspections pass/fail
  (`QcInspectionsFilterSheet`), lookups active/all (`QcLookupsFilterSheet`), and
  stats presets + custom range (`QcStatsFilterSheet`). The tab segment stays a
  tab switch (navigation) and the IMEI scan field stays inline (search); the
  queue has no filters.
- Shipments/Suppliers endpoints take no filter params, so search and facets are
  client-side in `ShipmentsViewModel` (flows derived from the raw lists):
  shipments search supplier/date/notes with a `ShipmentsFilterSheet` (status
  open/received/all + date range); suppliers search name/phone/country inline.
  A compact `MetricGrid` summarises the full list (total, open, received units).
  New shipment / new supplier are compact `Add` icon actions beside the search.
  Progress chip colour comes from `shipmentStatusColor` (open→info,
  partial→warning, received→success).
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
- The Shipments tab segment reuses `nav.shipments` ("Partiyalar") to avoid the
  long `shipments.title` ("Partiyalar va yuk qabuli"); it now reads the same as
  the top-bar title. A distinct short segment label from Gemini would remove the
  duplication.
- No `shipments.statusPartial` label: partial batches reuse `statusOpen` and are
  told apart by the warning tint. No "pending units" label for the summary, so
  the third tile shows received units (`shipments.receivedCount`) instead of
  expected − received.

## Open questions
- `ProcurementService` runs on a second HTTP client because the wave-0
  `ApiService` cannot be edited; promote these routes onto it and delete
  `data/ProcurementApi.kt`'s factory.
