# ledger

The store's cash/card money ledger (ADR 0024, 0025). Append-only and signed:
every money movement is one `cash_transactions` row; a balance is the **sum** of
rows per account, never a stored number. 2a is the ledger plus the owner's
manual entries; 2b (ADR 0025) makes sales / returns / expenses / partner
payments / purchases / overhead post rows automatically.

## Owns

- `cash_transactions` (the ledger), `cash_accounts` and `cash_transaction_types`
  (lookups; CASH/CARD and OPENING/DEPOSIT/WITHDRAWAL/CORRECTION/TRANSFER +
  SALE/REFUND/PARTNER_PAYMENT/PURCHASE/OVERHEAD/EXPENSE + CREDIT_PAYMENT seeded
  in both `seed.sql` and the migration — `migrate deploy` never runs the seed).
  A `CREDIT_PAYMENT` row links to its payment via `creditPaymentId` (ADR 0035);
  a credit sale itself posts no SALE row. A `SHIFT_DIFFERENCE` row (ADR 0036)
  links to its shift via `shiftId` and reconciles a closing cash count. A
  `CUSTOMER_PURCHASE` row (ADR 0039) links via `customerPurchaseId` to a phone
  bought from a customer (money out); a trade-in posts no row. It is a cost type
  (hidden in history without `device.cost.view`).
- The sign convention (`lib/signed-amount.ts`), the one-opening-per-account and
  transfer rules, proportional refund splitting (`lib/proportional-split.ts`),
  and deriving a source's current account from its rows (`lib/source-nets.ts`).

## Exposes

- `GET /ledger/accounts` — active accounts `[{ accountCode, label }]` in
  `sortOrder`, no amounts. **Any signed-in user** (no permission): the checkout /
  expense / payment pickers need it without `balance.read`.
- `GET /ledger/balances` — per-account balance + total, as **decimal strings**
  summed in exact `Decimal` (`balance.read`).
- `GET /ledger/transactions` — history, newest first, paginated, filter by
  `accountCode`/`typeCode`/`from`/`to`; every item carries the five nullable
  source ids (`balance.read`). A caller **without** `device.cost.view` gets
  `amount: null` on cost-type rows (`PURCHASE`/`OVERHEAD`/`DEVICE_EXPENSE`/
  `CUSTOMS`/`CUSTOMER_PURCHASE`, listed in `COST_TYPE_CODES`) — ADR 0028/0039;
  balances are not redacted.
- `POST /ledger/transactions` — one manual entry (`balance.manage`).
- `POST /ledger/transfers` — two rows, one transaction (`balance.manage`).
- `LedgerService.post(entry, tx?)` — the single write primitive. 2b modules
  inject `LedgerService` and call `post(entry, tx)` inside their own
  `$transaction` so a sale and its ledger rows commit atomically. They build a
  `LedgerPost` (signed amount + at most one source id); no module ever injects
  `LedgerRepository`.
- `LedgerService.salePayments / expenseAccounts / partnerPaymentAccounts /
  customerPurchaseAccounts / activeAccountCodes` — derived reads 2b modules use
  to shape their responses and validate caller-supplied accounts.
- `LedgerService.shiftRows(userId, from, to)` / `shiftDifferences(shiftIds)` —
  the shift report's raw input (a cashier's cash rows in a window) and the net
  `SHIFT_DIFFERENCE` per shift for the shifts list (ADR 0036).
- `LedgerService.digestBalances(dayStart)` — per-account opening (rows before
  `dayStart`) and closing (now) balances for the Telegram closing digest (2c);
  the telegram module calls this instead of reading ledger tables.

## Must never

- Update or delete a row. A mistake is fixed by a new row: a difference, a
  reversal, or a CORRECTION — never an edit. Difference posters read the old
  amount under a `FOR UPDATE` lock inside their transaction (ADR 0028).
- Store a balance. Always sum. Balances may go below zero; nothing is blocked.
- Let another module reach past `LedgerService` into the repository.

## Open questions

- Acquisition-cost edit and device-delete posters are specified in ADR 0025 but
  dormant (no such path exists yet). The Telegram balance digest (2c) is done:
  `digestBalances` above.
