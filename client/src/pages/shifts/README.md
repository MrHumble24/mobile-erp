# pages/shifts

The `/shifts` list (ADR 0036), in the Finance nav group, guarded by `sale.read`.

## What it shows

- Paged shifts newest first: cashier, opened, closed (or "still open"), opening
  count, counted cash, difference (coloured short/over).
- A date range filter (from/to). A cashier filter only for `shift.manage`
  (without it the server returns the caller's own shifts).
- Row click opens the printable report (`ShiftReportDialog` from `manage-shift`).
- With `shift.manage`, an open shift of another cashier shows "Force close".

## Composition

- Data via `entities/shift` hooks (`useShifts`, `useShiftReport`); cashier options
  via a page hook over `entities/user`. Actions via `features/manage-shift`.
- Filters + pagination are URL-backed (`use-shifts-filters`), the page's single
  source of filter state.
