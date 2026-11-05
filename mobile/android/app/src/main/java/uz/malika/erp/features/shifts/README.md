# shifts (Android)

Cashier shifts (Change 11, ADR 0036). Optional per store (`shiftsEnabled`, off by
default). A cashier counts the drawer cash on opening and again on closing; a
closing difference is posted to the store balance (server-side) so it always
matches the real cash. Online only — `/shifts` has no offline feed.

## What it owns
- `data/` — `/shifts` DTOs, Retrofit `ShiftApi`, `ShiftRepository` (which caches
  the last-known open flag for the offline sell gate).
- `lib/ShiftMath` — the one client figure: the live close-out difference preview
  (`counted − expected`). Unit-tested. The server owns expected cash.
- `model/` — `ShiftViewModel` (current shift + open/close + the sell gate) and
  `ShiftsListViewModel` (list with date + cashier filters).
- `ui/` — `ShiftBar` (till status), `ShiftSheets` (open/close), `ShiftReportSheet`,
  `ShiftsScreen` (list), `ForceCloseSheet` (`shift.manage`).
- `ShiftsFeature` — nav route `shifts` (perm `sale.read`), registered in
  `FeatureRegistry`.

## The selling gate
The server lets offline replays (`/sync/push`) through the shift gate, so the app
must block selling itself: when online + `shiftsEnabled` + no open shift, the till
checkout and the credit button are disabled with an "Open a shift" prompt. Offline
it follows the last-known cached state. A 409 `NO_OPEN_SHIFT` from `POST /credits`
is also handled (credit is online).

## Must never
- Store a balance / expected / difference, or a status column. Reopen a closed
  shift. Count card by hand. Queue a shift through sync.

## i18n
Namespace `shifts` is read from the web client's JSON (`i18n/I18n.kt`). English for
now; Uzbek via a Gemini handoff. The `SHIFT_DIFFERENCE` balance row already renders
with the server's own label ("Shift difference") via the ledger-label fallback.
