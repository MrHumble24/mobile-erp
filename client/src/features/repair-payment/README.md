# feature: repair-payment

Money on a repair ticket (`repair.payment`). Customer payments and refunds post
through `LedgerService` (`REPAIR_PAYMENT`); an outside-master payment posts
`REPAIR_OUTSIDE`. Composes the `repair` and `ledger` entities.

## Exposes

- `RepairMoneyActions` — take a payment (capped at amount owed), refund (capped
  at net paid), and — for an outside-master ticket — pay the master. One
  `RepairMoneyDialog` serves all three modes; it picks Cash or Card via the
  ledger `AccountSelect`.

## Must never

- Take money without an account, or exceed the client cap the server enforces.
  A 400 "above owed" and the `NO_OPEN_SHIFT` code surface as readable toasts.
