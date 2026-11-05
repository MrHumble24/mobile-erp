# features/adjust-bonus

The one owner action "correct a customer's points" (ADR 0043, `bonus.adjust`).

## Owns

- The correction dialog: a signed amount (not zero, at most 2 decimals) and a
  required reason, validated by the zod schema in `model/`.
- The write through `entities/bonus`'s `useAdjustCustomerBonus`; success closes
  the dialog and shows the usual toast, failure shows the server's message.

## Exposes

- `AdjustBonusDialog` — `{ customerId, open, onOpenChange }`.

## Must never

- Be shown to a caller without `bonus.adjust` (the page checks and passes it).
- Fetch the balance itself or compute it; the server owns the ledger.
