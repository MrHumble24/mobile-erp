# Inventory slice (iOS)

Native port of the web `inventory` page group: devices, device models +
attributes, stock-alert rules. One `device.read` nav entry, three tabs.

## Owns
- `InventoryModule` — the single `FeatureModule` (nav: `nav.inventory`).
- Devices: offline list (SwiftData cache via `@Query`) as white cards on the
  ground, a status chip row (`InventoryMetricsBar`: label + mono count, tap to
  filter, low-stock jumps to Alerts), system search, and a kit `FilterSheet`
  for model / storage. Tabs are the kit `SegmentedControl`; the title is
  `nav.inventory` like the tab and the Android top bar. Online detail as a Warm
  Card sheet (`appSheet`): title + close, `CopyableIMEI` lines, status pill,
  Sell (primary) / Run QC (secondary) / Edit (ghost), white barcode plate,
  surface-2 fact blocks (specs + intake date, cost + margin, QC), translated
  history with `KitDate` timestamps, then the kit-field status-change form.
  iPad shows a `NavigationSplitView` master-detail with the same sheet body.
  Debug: `-openDevice <imei>` opens a device for screenshots.
- Optional second IMEI (dual-SIM): `DeviceDetail.imei2` / `DeviceListItem.imei2`
  (cached via `DeviceEntity.imei2`). List rows and the detail sheet show it when
  present (detail uses `CopyableIMEI` for both lines); list search and the POS /
  warranty cache lookups match either IMEI. `EditDeviceSheet` edits it behind a
  "Dual SIM" toggle (`inventory.dualSim`, `AppSwitchStyle`), default on when
  `device.imei2` is present: on requires it (15-digit, ≠ IMEI; empty →
  `inventory.imei2Required`); off clears it (null on PATCH). Dual-SIM is derived
  (`imei2 != nil`), never stored.
- Device-sheet cross-feature actions: **Sell in POS** (`.pos(imei:)`, IN_STOCK +
  `sale.create`) and **Run QC** (`.qc(imei:)`, IN_STOCK/DEFECTIVE + `qc.create`)
  via `container.router`. The devices tab also *consumes* an incoming
  `.inventory(imei:)` route and opens that device. Write results toast via
  `container.toasts`.
- Device models (white cards, "Faol" pill, toolbar +) + create/edit in a Warm
  Card sheet with the dynamic attribute schema editor (ADR 0013): each attribute
  a surface-2 block of kit fields (label / key / type `AppSelect` / options chips
  / required toggle / reorder-delete). Options commit on Return **or** the ghost
  add pill (a Button inside a Form row used to swallow the tap). Debug:
  `-openTab models`, `-openModel new|<id>`.
- Option-less `select`: a `select` attribute with no options renders as a text
  field in `DynamicSpecFields` — the server accepts any value for it, and a
  picker offering only "—" used to block adding or updating a device.
- Alerts: "Kam qolgan modellar" cards (model + storage, live count against the
  minimum as a danger / success pill), then rule cards (threshold in mono,
  labelled once) with an inline "Yangi qoida" primary pill (no toolbar +); the
  rule form is a Warm Card sheet of kit fields (model `AppSelect` fixed on
  edit, storage from the model's options, numeric threshold). Debug:
  `-openTab alerts`, `-openRule new`.

## Public API
- `InventoryModule.feature` — register with one line in `FeatureRegistry`.
  Integrator line: `InventoryModule.feature,`

## Permissions (codes, never roles)
- Section + lists + models/alerts reads: `device.read`
- Models tab + device edit: `device.update`
- Manual status change: `device.status.change`
- Cost / margin fields: `device.cost.view` (absent → hidden, never modelled)
- Rule create / update: `settings.manage`

## Must never
- Import another feature slice, or edit foundation (`Core/Data/Shared/Theme/App`).
- Queue writes offline: every write here is online-only and blocks with a
  connection message (only sale/consignment use the outbox).
- Model cost fields as required — they are redacted for under-privileged users.

## Note
PATCH writes (`/devices/:id`, `/device-models/:id`, `/stock-alert-rules/:id`) go
through the shared `container.api` (`patchVoid` for typed bodies, `patchJSONVoid`
for the open-ended device-specs body) — no slice-local HTTP client.
