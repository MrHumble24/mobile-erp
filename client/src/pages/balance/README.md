# page: balance

Route `/balance` (gated by `balance.read`). The owner's view of the store's cash
and card money: per-account balances, the total, and the full history of changes.

## Composes
- `entities/ledger` hooks for balances and paginated history.
- `features/record-ledger-entry` dialog (shown only with `balance.manage`) for the
  five actions: set starting balance, deposit, withdraw, correction, transfer.

## Owns
- `useBalanceFilters` — URL-backed account/type/date-range filters + pagination.
  Date range is sent as local-day-bound UTC instants (start/end of the chosen day
  in the user's timezone), not UTC-midnight.
- Balance cards (negative = destructive token), history table, filters, actions menu.
  The type filter and labels cover the `DEVICE_EXPENSE` / `CUSTOMS` types (ADR
  0026/0027); a redacted cost row (`amount: null`) shows `balance.amountHidden`,
  never NaN or 0 (ADR 0028).

## Must never
- Check role names: it reads `balance.read` / `balance.manage` from the auth store.
- Call HTTP or hold server state outside React Query.

## Left out
- No CSV export, no per-column sort UI (history is fixed newest-first).
