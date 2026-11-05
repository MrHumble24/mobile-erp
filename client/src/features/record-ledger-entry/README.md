# feature: record-ledger-entry

One dialog for the owner's five money actions: set starting balance, deposit,
withdraw, correction and transfer. Deposit/withdraw/transfer require a positive
amount; opening and correction take a signed non-zero amount; correction needs a
reason; transfer needs two different accounts.

## Owns
- `LedgerEntryDialog` — opened in one `mode`; fields adapt to the mode.
- `ledger-entry.schema.ts` — zod schema factory per mode plus DTO mappers.

## Must never
- Decide who may open it: the page gates on `balance.manage`.
- Talk HTTP directly — it writes through `entities/ledger` hooks, which invalidate
  balances and history on success.

## Decision
The five actions share two endpoints (`POST /ledger/transactions` and
`/ledger/transfers`), so they are one mode-parameterised dialog rather than five
feature slices — mirrors `log-expense` handling create + edit in one dialog.
