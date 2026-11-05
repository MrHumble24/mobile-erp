# ledger

The store's cash/card money ledger (ADR 0024). Append-only and signed: every
money movement is one `cash_transactions` row; a balance is the **sum** of rows
per account, never a stored number. 2a (this module) is the ledger plus the
owner's manual entries; 2b makes sales/returns/expenses/partner payments/
purchases post rows automatically.

## Owns

- `cash_transactions` (the ledger), `cash_accounts` and `cash_transaction_types`
  (lookups; CASH/CARD and OPENING/DEPOSIT/WITHDRAWAL/CORRECTION/TRANSFER seeded).
- The sign convention (`lib/signed-amount.ts`) and the one-opening-per-account
  and transfer rules.

## Exposes

- `GET /ledger/balances` — per-account balance + total (`balance.read`).
- `GET /ledger/transactions` — history, newest first, paginated, filter by
  `accountCode`/`typeCode`/`from`/`to` (`balance.read`).
- `POST /ledger/transactions` — one manual entry (`balance.manage`).
- `POST /ledger/transfers` — two rows, one transaction (`balance.manage`).
- `LedgerService.post(entry, tx?)` — the single write primitive. 2b modules
  inject `LedgerService` and call `post(entry, tx)` inside their own
  `$transaction` so a sale and its ledger row commit atomically. They build a
  `LedgerPost`; no module ever injects `LedgerRepository`.

## Must never

- Update or delete a row. A mistake is fixed by a new row (CORRECTION).
- Store a balance. Always sum. Balances may go below zero; nothing is blocked.
- Let another module reach past `LedgerService` into the repository.

## Open questions

- The SALE/REFUND/... types, source-row links and split payments arrive in 2b;
  the Telegram balance digest in 2c. `currentStoreId()` is store-scoped already.
