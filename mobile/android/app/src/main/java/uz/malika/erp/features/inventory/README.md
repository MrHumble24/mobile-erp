# features/inventory

The Inventory slice group, ported from the web `pages/inventory` +
`device`/`device-model`/`stock-alert` slices and the deleted Flutter app
(`47971dd`). One `FeatureModule` → `InventoryFeature`, one nav item (`inventory`,
gated by `device.read`).

## Owns
- **Devices**: offline-first list (Room mirror). The main screen stays uncluttered:
  a row of status chips (`InventoryMetricsBar`: label + mono count; a tap toggles
  the status filter, the selected chip wears the status pill pair; low-stock jumps
  to Alerts), an inline scan/search field beside a `FilterButton` (shared `SearchFilterRow` pattern — the scanner keeps
  its camera affordance, so the row is hand-built), and the list. Model + storage
  filters live in `DeviceFilterSheet` (shared `FilterSheet`); the button badge counts
  non-default sheet filters and reset calls `DevicesViewModel.clearFilters()`. There is
  a detail sheet (specs, QC, status history,
  barcode). Edit specs + target price and manual status transitions (ADR 0012)
  are online-only writes. An optional **IMEI 2** (dual-SIM) shows as a secondary
  mono line in list rows and as its own copy-able line in the detail sheet when
  present; it is editable in `EditDeviceSheet` behind a **Dual SIM** toggle
  (`inventory.dualSim`) that defaults ON when `device.imei2` is set. On ⇒ the
  IMEI 2 field is required (15 digits, ≠ IMEI via shared `isImei`); off ⇒ the
  save sends an explicit `null` to clear it. Search matches either IMEI.
  The device cache carries `imei2` (Room schema v2, `MIGRATION_1_2` — a plain ALTER
  so the outbox survives) and `DeviceDao.findByImei` matches `imei OR imei2`, so a
  scan of the second number resolves the device everywhere (POS, warranty,
  consignment). The detail sheet is a Warm Card sheet mirroring iOS: title, mono
  IMEI lines with copy, status pill, then Sell (the one orange) / Run QC
  (secondary) / Edit (ghost) full width, the white barcode plate, surface-2
  fact blocks (specs + intake date, cost + margin, QC) and the history list with
  `shared/lib/DateFmt` dates. Margin block shows only when landed cost is present
  (cost is redacted → null for under-privileged users).
  - Detail actions: "Sell in POS" (`IN_STOCK` + `sale.create`) and "Run QC"
    (`IN_STOCK`/`DEFECTIVE` + `qc.create`) hand off to POS/QC via
    `featureNav.open`; copy-IMEI and status change toast `container.toaster`.
    Incoming `inventory` arg opens the sheet via `consumeArg`. On tablets
    (≥720dp) the detail is a master-detail side pane, not a bottom sheet.
- **Models**: device-model list (white cards, "Faol" pill) + create/edit in a
  Warm Card sheet with the dynamic attribute schema (ADR 0013): each attribute is
  a surface-2 block (label / key / type select / options chips / required
  switch / reorder-delete). Options commit on IME Done **or** the explicit ghost
  add pill. Shown only with `device.update`.
- **Option-less `select`**: a `select` attribute whose option list is empty (the
  server's default storage/color scaffold, or a list the owner has not filled)
  renders as a free-text field in `DynamicSpecFields` — the server accepts any
  value for it, and an empty dropdown used to block adding or updating a device.
- **Alerts**: "Kam qolgan modellar" cards (model + storage, live count against
  the minimum as a danger / success pill), then "Ogohlantirish qoidalari" cards
  (threshold in mono, labelled once) with "Yangi qoida" as the one orange; the
  rule form is a Warm Card sheet (model select fixed on edit, storage select from
  the model's storage options, numeric threshold). Writes need `settings.manage`.

## Public API
`InventoryFeature` (the module object) only. No other slice imports from here.

## Must never
- Edit foundation (`core/data/shared/theme/app`) or another feature slice.
- Queue writes to the outbox — only `sale`/`consignment` may; every write here is
  online-only and blocks with a needs-connection message when offline.
- Model or cache cost fields.
- Hand-write Uzbek — all copy comes from web i18n keys via `t()`.

## Notes
- `data/InventoryApi.kt` is a slice-local Retrofit (device/model/stock endpoints
  are not on the foundation `ApiService`); it reuses the container's base-URL +
  auth behaviour. `ui/AppSelect.kt` is a slice-local Caldera select (the kit ships
  none). Both are candidates for the integrator to promote.
- `t("common.offline")`, `inventory.selectDevice` and kit-wide `common.loadMore`
  are not yet in the web i18n JSON (Gemini handoff); the raw key shows until added.
