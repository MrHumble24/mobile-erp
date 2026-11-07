# Repairs (slice)

Repair tickets (Change 13, ADR 0040). Optional, off by default
(`StoreSettings.repairsEnabled`) — **the whole feature is hidden while off**
(`RepairsModule.isEnabled` → `AppContainer.storeFlags.repairsEnabled`). **Online
only.** **No passcode / pattern / ID field anywhere, by design.**

## Owns / exposes

- `RepairDTO` (`Data/`): the ticket views (cost figures nil without
  `device.cost.view`), the master union, and the write payloads
  (`CreateRepairPayload`, `ChangeStatusPayload`, `AddPartPayload`,
  `RepairMoneyPayload`).
- `RepairsRepository` (`Data/`): every `/repairs` route + `/users` (own masters)
  and `/device-models` (QUANTITY parts; IMEI/SERIAL for the optional ticket model
  via the Purchases slice).
- `RepairStatus` (`Lib/`): the state machine (legal moves, terminal), ported from
  the server with a DEBUG self-check (`RepairStatusSelfCheck`).
- `RepairError` (`Lib/`): maps the server codes (REPAIRS_DISABLED,
  REPAIR_ILLEGAL_MOVE / TERMINAL / BALANCE_OWED / NOT_OUTSIDE, NO_OPEN_SHIFT) to
  readable messages (the `repairs` namespace is now bundled; a few keys still
  use English `default:` fallbacks — see i18n below).
- `RepairsListModel` / `NewRepairDraft` (`Model/`).
- `RepairsModule`: the More-tab screen (`repair.read` + `repairsEnabled`).
- UI (`UI/`): list, new-ticket sheet, detail + sections, status sheet, parts
  sheet, the one money sheet (payment / refund / outside), the report sheet,
  the customer field.

## Must never

- Store a passcode / pattern / passport / ID-document field — anywhere.
- Queue a repair for offline replay — repairs are online only.
- Show cost figures (parts / outside / profit) the server redacted.
- Be visible while `repairsEnabled` is off.

## i18n

The web `repairs` namespace is now bundled in both locales and Uzbek-complete
(`client/src/shared/i18n/{uz,en}/repairs.json`); it is no longer an
English-only fallback. The iOS slice still references several key names that
are not in that namespace (e.g. `repairs.reportTitle`, `repairs.useRange`,
`repairs.status_<CODE>`, `repairs.newTitle`, `repairs.createTicket`,
`repairs.onlineOnly`, `repairs.createdToast`, `repairs.deviceNamePlaceholder`),
so those labels keep their English `default:` fallbacks. The wrong report key
is `repairs.reportTitle` — it does not exist in `repairs` (it belongs to
`credit.reportTitle`); the report title / rows should use `reportTab` /
`reportIncome` / `reportPartsCost` / `reportOutsideCost` / `reportProfit`.
Reconcile these key names for full Uzbek parity (see `mobile/ios/SCREENS.md`).

Remaining mobile parity gaps: edit ticket, print/share ticket, customer repair
list, and the iOS key mismatch above.
