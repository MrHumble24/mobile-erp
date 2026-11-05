# features/manage-shift

The cashier-shift lifecycle actions (ADR 0036): open, close, force-close, plus the
till shift bar and the printable report dialog.

## Public API (`index.ts`)

- `useOpenShift` / `useCloseShift` / `useForceCloseShift` — the mutations; they
  invalidate `shiftKeys.all` (and the ledger on close, which posts the difference).
- `ShiftBar` — the till bar; shows "open since HH:mm" + Close, or "no open shift"
  + Open. Mounted only when `shiftsEnabled`; it is the visible selling gate.
- `OpenShiftDialog` / `CloseShiftDialog` — the count forms. Close shows live
  expected cash and the difference before confirming.
- `ForceCloseShiftDialog` — admin closes another cashier's shift (note required).
- `ShiftReportDialog` — report + print, reused by the till close flow and `/shifts`.

## Must never

- Read a shift via its own `useQuery` — it uses `entities/shift` hooks. Block the
  till on its own; the widget composes the bar and the gate flag.
