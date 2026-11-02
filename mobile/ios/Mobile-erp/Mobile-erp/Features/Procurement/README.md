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

## Cross-feature kit integration
- Load-more paging (`KitPaginator`) on the QC queue, inspections, and the
  shipment-detail device list.
- Inspections pass/fail filter; QC stats custom range (`KitDateRangeField`,
  overrides the presets); post-intake landed-cost summary (cost-gated).
- QC consumes an incoming `.qc(imei:)` route → opens the grade sheet.
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

## Open questions
- None outstanding for the stock wave.
