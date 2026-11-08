# feature: pay-on-credit

The till action "sell this cart on credit" (ADR 0035). A named customer with a
phone takes the goods now and pays ONE fixed agreed price in parts. ADR 0068 adds
an optional margin: the cash price plus one margin disclosed up front
(Murabaha), entered as a percent or a fixed sum. It never grows — no interest,
no late fee, no penalty.

## Owns

- `CreditStep` / `CreditStepBody` — the full-screen POS step that replaces the
  whole till canvas: customer, the disclosed margin, down payment, plan, a
  pinned review of `cashPrice + markup = agreedTotal`, and the confirm action.
- `CreditDialog` — the compact dialog form, kept for any non-POS caller.
- `useCreditMarkup` — the optional margin state (percent ↔ fixed sum, cent-exact,
  capped at the cash price) and the resulting agreed price.
- `useCreditDraft` — the draft state, cent-exact plan validity, and automatic
  rebalancing when the agreed price changes.
- `useCreateCredit` — the one atomic `POST /credits` mutation + cache invalidation.
- `lib/down-payment.ts`, `lib/credit-error.ts` — tender lines + 400 → `credit.*`.

## Public API

`CreditStep`, `CreditDialog`, `useCreateCredit` from `index.ts`.

## Must never

- Price a line itself: the caller passes `lines` already priced by the checkout
  (`toCreditLines`) at the **cash** price. The server adds the margin.
- Create a credit offline — it is online only; the caller disables the action
  and the step shows `credit.errorOffline`.
- Show interest, a late fee, a penalty, or any price that grows with time. The
  margin is one fixed amount agreed once, disclosed in the review and contract.
