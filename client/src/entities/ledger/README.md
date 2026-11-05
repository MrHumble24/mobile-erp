# entity: ledger

The store's money ledger: cash/card account balances and the append-only history
of every change.

## Owns
- Domain types for balances, transactions, entry and transfer DTOs.
- `ledgerRepository` — the only code that calls `/ledger/*`. Parses money (number
  today, decimal string soon) into numbers for balances; transaction `amount`
  stays a signed decimal string.
- `ledgerKeys` — query-key factory (`accounts`, `balances`, `transactionList(filters)`).
- Hooks: `useLedgerBalances`, `useLedgerTransactions`, `useCreateLedgerEntry`,
  `useLedgerTransfer`. Writes invalidate both balances and transactions.
- `accountI18nKey` / `typeI18nKey` / `accountLabel` — map stable server codes to
  `balance` i18n keys; return `undefined` / fall back to the server label for unknown
  codes. `KNOWN_TYPE_CODES` includes `DEVICE_EXPENSE` and `CUSTOMS` (ADR 0026/0027).
- `useAccountOptions` — active accounts for the pickers from `GET /ledger/accounts`
  (open to any signed-in user); falls back to `CASH`/`CARD` only until it resolves.
- Transaction `amount` is a signed decimal string **or `null`** when a cost row is
  redacted from a caller without `device.cost.view` (ADR 0028).
- Payment base UI, reused everywhere money moves: `AccountSelect` (single account),
  `PaymentMethodField` (Cash / Card / Split that must sum to a total, with
  `splitRemaining`), `PaymentSummary` (read-out of a sale's tender lines).
- `PaymentMethod` / `PaymentPart` / `AccountOption` types.

## Must never
- Hold server state outside React Query, or know about the URL or import `fetch`.
- Hard-code the account or type list: render whatever the server returns (the
  `CASH`/`CARD` fallback is only the pre-resolve default).

## Open questions
- `balance`/`total` are decimal strings; the repository parses them into numbers.
