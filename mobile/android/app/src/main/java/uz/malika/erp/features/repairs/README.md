# feature: repairs

Repair tickets (Change 13, ADR 0040). Optional, off by default
(`StoreSettings.repairsEnabled`). One route `repairs` (perm `repair.read`,
ADMIN-only by default) in the More tab. Online only.

## Owns
- `data/` — `RepairApi` + `RepairRepository` (`/repairs`), transport models
  (views + request bodies). Cost figures are redaction-nullable.
- `lib/RepairStatus.kt` — the state machine ported 1:1 from the server
  (`repair-status.ts`): legal moves + terminals, unit-tested.
- `model/` — `RepairsListViewModel` (status/date/search + the finance report),
  `RepairDetailViewModel` (loads a ticket, runs money/parts/status actions — each
  returns the full updated ticket), `CreateRepairViewModel`.
- `ui/` — `RepairsScreen` (list + report + new ticket), `CreateRepairSheet`,
  `RepairDetailSheet` (+ `RepairDetailBlocks`, `RepairPartsSection`,
  `RepairMoneySheet`, `StatusNoteDialog`), `RepairStatusMeta` (one hue per status).

## Setting gate
Every `/repairs` route answers **403 `REPAIRS_DISABLED`** when the setting is off.
The list surfaces that as the "turned off" state. The Repairs nav entry is
permission-gated (`repair.read`, ADMIN-only) and so only the owner — who controls
the switch — ever sees it; tapping it while off shows the off state. (Reactive
nav hiding by a setting would need app/shell changes beyond this slice.)

## Must never
- Store a passcode / pattern, a passport number or any ID-document data — by
  design, no such field exists.
- Queue anything: every call is online (the server checks the shift + posts money
  live). Show cost figures without `device.cost.view` — they arrive null.

## Depends on
- `features/inventory` for the models + quantity products (`CatalogRepository`).
- `features/sales` for the customer picker + the users list (own-master picker).

## i18n
The `repairs` namespace is not an Android-local asset. Like every namespace it
comes from the web client `client/src/shared/i18n` (both `uz` and `en`,
Uzbek-complete), mapped into assets by `app/build.gradle.kts`; there is no
`assets/en/repairs.json`. Note the report card labels the outside-cost figure
with `repairs.outsidePaid` ("Paid to master") while the namespace defines the
report-specific `reportOutsideCost` ("Outside cost"); the other report keys are
`reportIncome`, `reportPartsCost` and `reportProfit`.

Remaining mobile parity gaps: edit ticket, print/share ticket, customer repair
list, and the iOS key mismatch (see `mobile/ios/SCREENS.md`).
