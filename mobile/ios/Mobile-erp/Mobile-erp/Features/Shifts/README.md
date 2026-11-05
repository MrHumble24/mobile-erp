# Shifts (slice)

Cashier shifts (Change 11, ADR 0036). Optional per store (`shiftsEnabled`, off by
default). A cashier counts the drawer cash on opening and again on closing; the
closing difference posts to the store balance so it always matches the real cash.
One shift per cashier. Online only (no outbox path).

## Owns / exposes

- `ShiftMath` (`Lib/`): the only client-computed figure — counted − expected (the
  closing preview), in tiyin, with a DEBUG `ShiftMathSelfCheck` (−20,000 on an
  11,480,000 vs 11,500,000 count; short / over / none).
- `ShiftRepository` + DTOs (`Data/`): `/shifts/current` (empty body ⇒ nil),
  `/shifts` (list), `/:id/report`, `/open`, `/close`, `/:id/force-close`, and the
  cashier options for the manage filter.
- `ShiftModel` (`Model/`): the till's current-shift state + the **selling gate**
  (`blocksSale(online:)`): online needs an open shift; offline it is allowed when
  a shift was open the last time we looked (cached), since the server trusts
  replays. `ShiftsListModel`: the list filters (date + cashier for `shift.manage`).
- `ShiftsModule`: the shifts list in the More tab (`sale.read`).
- UI (`UI/`): `ShiftBar` (till: open since / close, or no open shift / open),
  `OpenShiftSheet`, `CloseShiftSheet` (expected live, counted, difference preview,
  note), `ShiftReportSheet` (opening/expected/counted/difference/card + movements
  by type), `ShiftsView` (list), `ForceCloseSheet` (`shift.manage`).

## Consumed by

- `Features/Pos`: the shift bar + the selling gate. `PosViewModel.checkout`
  refuses when `blocksSale`, and maps the server's 409 `NO_OPEN_SHIFT` to the
  open-a-shift prompt while keeping the cart. `CreditSheet` does the same for
  `POST /credits`.
- `Features/Settings`: the shifts switch. `Features/Balance`: the
  `SHIFT_DIFFERENCE` ledger-type label (`BalanceFormat`).

## Must never

- Store an expected/difference figure or a status column (all derived). Reopen or
  edit a closed shift (fix a wrong count with a balance correction). Queue a shift
  action for offline replay — shifts are online only.
