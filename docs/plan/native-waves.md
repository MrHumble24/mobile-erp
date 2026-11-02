# Native mobile build waves — `mobile/android` + `mobile/ios`

Native ports of the web ERP/POS. Replaces the Flutter app (in history at
`47971dd:mobile_erp/` — **use it as the porting spec**: same slices, same
offline model, same server contract). Decision record: ADR 0016.

## Stack

| Concern        | Android (`mobile/android`)                      | iOS (`mobile/ios/Mobile-erp`)                  |
|----------------|-------------------------------------------------|------------------------------------------------|
| UI             | Jetpack Compose + Material 3                    | SwiftUI                                        |
| State          | ViewModel + StateFlow                           | `@Observable` models                           |
| HTTP           | Retrofit + kotlinx.serialization (OkHttp auth)  | `URLSession` async/await + `Codable`           |
| Local DB       | Room (devices, partners, outbox, cursor)        | SwiftData (same tables)                        |
| Navigation     | Navigation-Compose, permission-gated            | `NavigationStack`/`NavigationSplitView`        |
| DI             | manual (`AppContainer`)                         | environment-injected container                 |
| Token storage  | EncryptedSharedPreferences / DataStore+Keystore | Keychain                                       |
| Scanner        | CameraX + ML Kit barcode, HID text field        | VisionKit `DataScannerViewController`, HID     |
| i18n           | client JSON (`client/src/shared/i18n`) as assets | same JSON bundled, single source              |
| Money          | `BigDecimal`                                    | `Decimal`                                      |
| Print          | Android print framework (58mm PDF)              | `UIPrintInteractionController`                 |

minSdk 24 · iOS 17.0 · iPhone + iPad (adaptive: rail/sidebar on wide screens).

## Offline model (unchanged from the Flutter plan)
`/sync/changes` hydrates devices + partners locally (offline reads everywhere).
Offline writes = only `sale.create`, `consignment.{create,settle,return}` via an
outbox drained by `/sync/push`. Every other write is online-only and blocks with
a "needs connection" message. Conflicts → inbox gated by `sync.resolve`.

## Waves
| Wave | Scope (each = one slice group, built per platform) |
|------|----------------------------------------------------|
| 0 | Foundation: config + dev panel (API URL switch), HTTP + error envelope, session/JWT/permissions, local DB + outbox + sync pull/push, adaptive shell + **feature registry**, i18n, theme (Caldera, near-monochrome), UI kit, scanner field, login |
| 1 | users/roles/permission matrix, settings, sync screen (queue + conflict inbox) |
| 2 | devices (list/filter/drawer/edit), device models + attributes, stock alerts |
| 3 | suppliers, shipments (intake, edit, landed cost), QC queue/grade/lookups |
| 4 | POS (scan→cart→checkout, offline), sales list/returns/receipt print, warranty lookup, customers |
| 5 | partners + ledger/payments, consignments (consign/settle/return, offline) |
| 6 | expenses + categories, reports, dashboard (index route) |

Extension contract per platform: `FOUNDATION.md` in each app's source root.
Telegram, backups, landed-cost math: server-side only.
