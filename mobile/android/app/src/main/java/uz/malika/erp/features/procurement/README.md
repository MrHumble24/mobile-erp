# features/procurement — Shipments, Suppliers & QC (native Android)

Ports the web `pages/shipments`, `pages/qc` and their features. One slice,
two nav items; Suppliers is a tab inside Shipments (no nav of its own).

## Owns
- Suppliers CRUD; shipments list/detail with landed cost (ADR 0006).
- Device intake: scan-first batch IMEI capture (`ScannerField`), 15-digit +
  required-spec validation, client-side duplicate block, landed-cost allocation
  server-side. The sheet is a scrollable `AppBottomSheet`; its layout leads with
  the **scanning station** (`IntakeDeviceForm`) — IMEI 1 label + Dual SIM toggle,
  the scanner, then IMEI 2 when dual — so a wedge scan lands without scrolling
  and the soft keyboard never buries the field (`ScannerField` keeps focus but
  passes `showKeyboardOnFocus = false`; the IME appears only on a tap). Under it
  the **batch defaults** (`IntakeBatchDefaults`) group model, spec fields,
  acquisition cost and target price in one `AppCard` headed `shipments.specs`;
  once model **and** a valid cost are set the block collapses to a one-line
  summary (model · cost · specs) with a chevron to reopen, staying open while
  either is missing. The **staged list** (`IntakeStagedList`) follows, then the
  error, the landed-cost results (`device.cost.view`, in an `AppCard`) and the
  submit button. The title carries a progress line counting
  `shipment.deviceCount + drafts` against the expected count
  (`shipments.registeredProgress`).
  A scan never submits a unit on its own: it FILLS the next empty IMEI slot
  (IMEI 1, then IMEI 2 when Dual SIM is on), checking length alone — a bad length
  is an inline error under that slot. Once every required slot is filled
  (`imeiSlotsFilled`) **and** model + cost are set, the unit stages. **A HID or
  typed scan (or completing the batch defaults) stages the unit directly** via
  `onAdd`; **only a camera read opens a kit `ScanConfirmSheet`** (both IMEIs in
  the subtitle) so a mis-read can be rejected before it is added. Staging (or
  confirm) clears both IMEI slots while keeping the batch defaults (Dual SIM /
  model / cost) and refocusing IMEI 1; a camera cancel keeps the filled slots.
  A missing model or cost (or spec) shows an inline hint **inside the batch-
  defaults block, under the field it names** — never under the scanner, and the
  operator is never told "IMEI 2 required" while scanning IMEI 1. The **Dual SIM**
  toggle (`inventory.dualSim`, form state, persists across the batch) sits inline
  on the IMEI 1 label row as one accessible `Role.Switch` target and reveals the
  second IMEI slot, which is then **required** (15 digits, ≠ IMEI). Dual-SIM is
  derived from `imei2`, never stored. The duplicate block spans both IMEIs, and
  `ShipmentDetailSheet` rows show `imei2` as a secondary line.
- Intake drafts live in `ShipmentsViewModel` (`drafts` map keyed by shipment id;
  `stageDraft` / `removeDraft` / `clearDrafts`), **not** in the sheet, so
  dismissing and reopening the intake sheet restores the staged units; submit
  clears that shipment's drafts on success. The duplicate check reads the VM list.
  The intake offline guard uses `sync.offline` (the kit `OfflineBanner` shows at
  the top of the sheet and submit is disabled while offline).
- QC: scan field over three segments — queue (`/devices?inspected=false`, cards
  with model / mono IMEI / status pill), inspections (cards with grade + result
  pills, inspector · time) and stats (one `MetricGrid` list-card + breakdown bars
  in the text colour, never orange). Reference data (grades, defect types, ADR
  0014) is a manager-only sub-page behind a link card under the queue — a
  fourth segment truncated at phone width; system Back returns. The grade sheet
  and lookup form are Warm Card sheets (surface-2 device block, kit checkbox
  rows for defects, `AppSwitch` for active).
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
  A compact `MetricGrid` summarises the full list: total batches, open batches,
  and received/expected units ("4 / 10") so the unit tile reads as units, not a
  third batch count. New shipment / new supplier are compact `Add` icon actions
  beside the search. Progress chip colour comes from `shipmentStatusColor`
  (open→info, partial→warning, received→success).
- `ShipmentCard` leads with the supplier (titleMedium) over the ISO date, a mono
  `received / expected` count, the status chip, and a hairline
  `LinearProgressIndicator` of intake completion tinted by that same colour.
  `ShipmentDetailContent` is headed by the batch identity (supplier, date,
  intake sentence) with overhead/notes rows shown only when present and the
  actions stacked full-width (continue-intake, then outline edit); device rows
  use `StatusChip` (`DeviceStatusMeta`) and label per-unit cost `inventory.landedCost`.
  A failed device-page load shows the kit `ErrorView` with retry, not "no devices".
- Post-intake landed-cost summary (per-device, `device.cost.view` only) and a
  grade-save toast (`container.toaster`). Shipments use a tablet master-detail
  pane (≥720dp) via `BoxWithConstraints`; incoming `qc` arg (device sheet
  → "Run QC") opens the grade sheet via `featureNav.consumeArg`.

## Public API
- `ProcurementFeature` — the only export the app registers (one line in
  `FeatureRegistry`). Everything else is internal to the slice.

## Must never
- Import another feature slice (it reads devices/models via its own repository).
- Queue writes to the outbox — every write here is online-only and blocks when
  offline (intake uses `sync.offline`; the other sheets still use the unmapped
  `common.offline` — Gemini handoff). Only sale/consignment may use the outbox.
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
  the third tile pairs received against expected units
  (`shipments.receivedCount` · "received / expected") instead of expected − received.

## Open questions
- `ProcurementService` runs on a second HTTP client because the wave-0
  `ApiService` cannot be edited; promote these routes onto it and delete
  `data/ProcurementApi.kt`'s factory.

## Notes
- Shipment carries an optional `paymentAccountCode` (default `CASH`, fixed at
  creation). The create form has a "Paid from" `AccountPicker` (`shared/payments`);
  on edit and in the detail it is read-only, since the server fixes it. The
  overhead-cost field is still present here but the server now rejects
  `overheadCost` — a follow-up task removes it from the form.
