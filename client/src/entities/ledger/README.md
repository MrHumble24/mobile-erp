# entity: ledger

The store's money ledger: cash/card account balances and the append-only history
of every change.

## Owns
- Domain types for balances, transactions, entry and transfer DTOs.
- `ledgerRepository` — the only code that calls `/ledger/*`. Parses money (number
  today, decimal string soon) into numbers for balances; transaction `amount`
  stays a signed decimal string.
- `ledgerKeys` — query-key factory (`balances`, `transactionList(filters)`).
- Hooks: `useLedgerBalances`, `useLedgerTransactions`, `useCreateLedgerEntry`,
  `useLedgerTransfer`. Writes invalidate both balances and transactions.
- `accountI18nKey` / `typeI18nKey` — map stable server codes to `balance` i18n
  keys; return `undefined` for unknown codes so callers fall back to the server label.

## Must never
- Hold server state outside React Query, or know about the URL or shadcn UI.
- Hard-code the account or type list: render whatever the server returns.

## Open questions
- Server may switch `balance`/`total` from number to decimal string; the repository
  already parses both.
