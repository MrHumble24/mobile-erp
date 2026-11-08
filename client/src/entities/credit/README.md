# entity: credit

Customer credit, the Islamic way — **no interest, ever** (ADR 0035). A named
customer with a phone takes a cart now and pays ONE fixed agreed price in parts.
ADR 0068 allows that price to be the cash price plus one margin disclosed up
front; it never grows later.

## Owns

- Domain types for `POST/GET /credits*` (`model/credit.types.ts`).
- `creditRepository` — the only HTTP caller for `/credits*`.
- `creditKeys` — the query-key factory (list/detail/contract/report).
- Read hooks: `useCredits`, `useCredit`, `useCreditContract`, `useCreditReport`.
- `lib/credit-plan.ts` — pure plan arithmetic (even split with the remainder on
  the last part, "left to plan", the limit check, UTC-day past-due) + spec.
- `ContractPaper` — the printable contract, built like the receipt. Shows the
  `cashPrice + markupAmount = agreedTotal` breakdown when a margin was agreed.

## Public API

Everything re-exported from `index.ts`. Never import a deep path.

## Must never

- Show or compute interest, a late fee, a penalty, or a price that grows with
  time — there is none. The ADR 0068 margin is a single disclosed amount,
  frozen at creation.
- Hold a credit mutation here: creating a credit and taking/refunding payments
  invalidate other entities' keys, so those hooks live in the feature layer
  (`features/pay-on-credit`, `features/credit-payment`).

## Open questions

None.
