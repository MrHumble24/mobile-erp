# shifts

Cashier shifts (Change 11, ADR 0036). Optional per store (`shiftsEnabled`, off
by default). A cashier counts the drawer cash on opening and again on closing;
a closing difference is posted to the store balance so it always matches the
real cash. Owns `shifts`.

## HTTP (all under `/shifts`)

- `GET /current` (`sale.create`) → my open shift with **live** figures, or
  `null`. `ShiftReportView` with `closedAt`/`countedCash`/`difference` null.
- `POST /open` (`sale.create`) `{ openingCount }` → `ShiftReportView`. 409 if I
  already have an open shift (also enforced by a partial unique index).
- `POST /close` (`sale.create`) `{ closingCount, note? }` → the closed
  `ShiftReportView`. 404 if I have no open shift. Posts one `SHIFT_DIFFERENCE`
  cash row (when counted ≠ expected) in the closing transaction.
- `GET /` (`sale.read`) `?cashierId&from&to&page&pageSize` → `{ items, total,
  page, pageSize }` of `ShiftListItem`, newest first. Without `shift.manage` the
  `cashierId` filter is forced to the caller (own shifts only).
- `GET /:id/report` (`sale.read`) → `ShiftReportView`. Own, or any with
  `shift.manage` (403 otherwise).
- `POST /:id/force-close` (`shift.manage`) `{ closingCount, note }` → the closed
  `ShiftReportView`. Closes another cashier's forgotten shift; note required.

`ShiftReportView` = who, openedAt, closedAt, note, `openingCount`,
`expectedCash`, `countedCash`, `difference` (counted − expected), `cardTotal`,
`byAccount[{accountCode,in,out,net}]`, `byType[{typeCode,count,total,
byAccount[{accountCode,count,total}]}]` — every figure a 2-dp string.

## The selling gate

`ShiftsService.assertCanSell(caller, { fromSync? })` is the public API sales and
credits inject. When `shiftsEnabled` and not an offline replay, a sale/credit
without an open shift throws **409 with `code: NO_OPEN_SHIFT`** so clients can
offer "open a shift". Off, or `fromSync`, it is a no-op.

## Invariants (all derived, never stored — `lib/shift-math.ts`)

- Movements = the cashier's cash ledger rows in `[openedAt, closedAt ?? now]`;
  the `SHIFT_DIFFERENCE` row is never a movement (it reconciles).
- expected cash = `openingCount` + net of CASH movements; difference =
  `closingCount` − expected (null while open). The list's `difference` comes
  from the shift's own `SHIFT_DIFFERENCE` total (ledger), 0.00 when closed clean.

## Must never

- Store a balance, an expected/difference figure, or a status column. Reopen or
  edit a closed shift's counts (fix a wrong count with a balance correction).
  Reach past `LedgerService` into the ledger repository.
