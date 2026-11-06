# entities/shift

Cashier shifts (ADR 0036, server `shifts` module). The business object plus its
read hooks, the printable report view, and the selling-gate helper.

## Public API (`index.ts`)

- Types: `ShiftReport` (the full computed view), `ShiftListItem`, `ShiftListResult`,
  `ShiftListFilters`, the three write DTOs.
- `shiftRepository` — HTTP: `current`, `list`, `report`, `open`, `close`, `forceClose`.
- `shiftKeys` — query-key factory; mutations in `features/manage-shift` invalidate it.
- `useCurrentShift(enabled)`, `useShifts(filters)`, `useShiftReport(id)` — reads only.
- `useShiftGate()` — turns the server's `NO_OPEN_SHIFT` 409 into a till prompt
  (the code is read through the shared `httpErrorCode`).
- `shiftDifference` / `differenceKind` — pure close arithmetic (counted − expected).
- `shiftTypeLabel` / `shiftAccountLabel` — movement code → `balance.*` i18n label.
- `ShiftReportView` — the one reusable report component (printable).

## Must never

- Hold a mutation (those live in `features/manage-shift`). Recompute a figure the
  server already derives. Import another entity (hence the local label map).
