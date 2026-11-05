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
  readable messages (English fallbacks; the `repairs` namespace may not be bundled).
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

The `repairs` namespace is added by the web later; until then every key uses an
English `default:` fallback (never Uzbek). All keys are listed in the build
report for reconciliation.
