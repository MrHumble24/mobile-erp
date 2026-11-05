# feature: pay-on-credit

The till action "sell this cart on credit" (ADR 0035). A no-interest plan: a
down payment now and parts due later, for a named customer with a phone.

## Owns

- `CreditDialog` — the whole flow: customer debt/limit, down payment (cash/card/
  split), the plan (fill evenly or edit by hand), live "left to plan", the limit
  guard, and the success view with a print-contract action.
- `useCreateCredit` — the one atomic `POST /credits` mutation + cache invalidation.
- `useCreditDraft` — the draft state and cent-exact plan validity.
- `lib/down-payment.ts`, `lib/credit-error.ts` — tender lines + 400 → `credit.*`.

## Public API

`CreditDialog`, `useCreateCredit` from `index.ts`.

## Must never

- Price a line itself: the caller passes `lines` already priced by the checkout
  (`toCreditLines`). Create a credit offline — it is online only; the caller
  disables the action and the dialog shows `credit.errorOffline`.
- Show interest, a late fee or a penalty. There is none.

## Open questions

None.
