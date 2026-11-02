# Inventory slice (iOS)

Native port of the web `inventory` page group: devices, device models +
attributes, stock-alert rules. One `device.read` nav entry, three tabs.

## Owns
- `InventoryModule` — the single `FeatureModule` (nav: `nav.inventory`).
- Devices: offline list (SwiftData cache via `@Query`) with search / model /
  storage / status filters; online detail sheet, edit, and manual status
  transitions (ADR 0012).
- Device models + dynamic attribute schema editor (ADR 0013).
- Stock-alert rules + low-stock list.

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
`InventoryHTTP` is a slice-local PATCH sender: the foundation `APIClient` only
exposes GET/POST, and the update endpoints are PATCH. It reuses `DevConfig`'s
base URL + the keychain token and mirrors the error envelope. Fold PATCH into
`APIClient` when the foundation is next touched, then delete this.
