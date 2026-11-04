# Procurement & QC (iOS slice)

Native port of the web Procurement & QC pages: suppliers, shipments + landed-cost
intake, and quality control.

## Owns
- Two shell entries (`ProcurementModules.swift`): **Shipments** (`shipment.read`,
  with a Suppliers sub-tab) and **QC** (`qc.read`).
- `Data/` — DTOs + repositories for `/suppliers`, `/shipments`, `/device-models`,
  `/devices`, `/qc/*`. Repositories take the shared `container.api` directly
  (GET/POST/PATCH all on `APIClient`).
- `Model/` — `AsyncStore`/`Loadable` (async reads), online-write guard, IMEI +
  lookup-code validation (with a `#if DEBUG` self-check), the intake draft.
- `UI/` — one screen/sheet per file: suppliers & shipment lists, shipment/supplier
  forms, shipment detail, device intake (ScannerField loop), QC queue, inspections,
  stats, lookups, grade-device + defects checklist, lookup form.
- Intake scan confirms before staging: a scan FILLS the next empty IMEI slot and
  only checks "15 digits". When every required slot plus model + cost is set,
  `IntakeDeviceForm` opens the shared `ScanConfirmSheet` automatically; the draft
  joins the batch only on Confirm. A batch duplicate (via the injected
  `isDuplicate`) opens the sheet's error variant.

## Cross-feature kit integration
- Load-more paging (`KitPaginator`) on the QC queue, inspections, and the
  shipment-detail device list.
- Inspections pass/fail filter; QC stats custom range (`KitDateRangeField`,
  overrides the presets); post-intake landed-cost summary (cost-gated).
- QC consumes an incoming `.qc(imei:)` route → opens the grade sheet.
- QC root (`QcScreen`) is the Android anatomy: scan field, kit `SegmentedControl`
  (queue / inspections / stats) with the bodies inline as white cards, and a
  manager-only link card to `QcLookupsView` (grades, defect types) — not a hub
  of pushed sub-pages. Inspections and stats filters are kit `FilterSheet`s
  behind a ghost "Filtr" pill; stats is a `MetricList` + breakdown bars in the
  text colour. Grade and lookup forms are Warm Card sheets of kit fields (no
  stock Form). Debug: `-open qc`, `-openTab inspections|stats`, `-openQcImei`.
- iPad master-detail (`NavigationSplitView`) for shipments; writes toast on success.

## Public API
`ShipmentsModule.feature` and `QcModule.feature` — the integrator adds both to
`App/FeatureRegistry.swift`. Nothing else here is imported from outside the slice.

## Must never
- Import another feature slice, or edit `App/`, foundation (`Core/Data/Shared/
  Theme/I18n`), or `project.pbxproj`.
- Queue a write to the Outbox — procurement writes are **online-only** (gated via
  `offlineBlock`); only sale/consignment writes may use the outbox.
- Parse money as `Double` (use `MoneyText`); hard-code Uzbek (use `t()`).
- Show cost fields when absent (redacted) — the landed-cost column and repair-cost
  input appear only when the server returns the value / the user `can` see it.

## Dual-SIM (second IMEI) & scan flow
- One combined IMEI block: IMEI 1 (shared `ScanOrValueField`) with the "Dual SIM"
  toggle (`inventory.dualSim`, `AppSwitchStyle`) on its label row; IMEI 2 appears
  underneath when on. Each field shows the captured value with a clear button, so
  there is no separate echo line.
- A scan (camera / HID wedge / typed + return) is routed by `fill` into the next
  empty slot — IMEI 1, then IMEI 2 when dual — and only checks 15 digits
  (`Imei.isValid`; bad length → one inline error, nothing else). Scanning IMEI 1
  in dual mode never errors "IMEI 2 required"; it just waits for the second scan.
- `stageIfComplete` opens the confirm sheet only once every required slot (IMEI 1,
  plus IMEI 2 when dual) **and** model + cost are set. If model/cost/specs are
  missing on a scan it shows a hint instead of erroring; a typed model/cost change
  re-checks silently. The same scan while the sheet is up is ignored.
- Confirm clears both IMEI slots and keeps model/specs/cost/dual for the next
  unit; Cancel keeps the filled slots so the operator can fix them. IMEI 1 is
  marked `autoFocus` so clearing it (on Confirm) re-shows and re-focuses the
  scanner for the next scan. Dual-SIM is
  derived (`imei2 != nil`), never stored — carried on `IntakeDraft`/`IntakeDeviceDTO`.
  Duplicate detection (`IntakeSheet` + the batch check at confirm time) matches
  either IMEI against either staged IMEI. QC queue rows show IMEI 2 when present.
- `ScanOrValueField` gained an optional `onScan` override (route a scan through
  `fill` instead of writing the binding) and an `autoFocus` flag forwarded to
  `ScannerField`, whose new `autoFocus: Bool` focuses the field on appear. Both
  default off, so other callers are unchanged.

## Open questions
- None outstanding for the stock wave.
