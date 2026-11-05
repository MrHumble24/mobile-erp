# entity: credit

Customer credit, the Islamic way — **no interest, ever** (ADR 0035). A named
customer with a phone takes a cart now and pays the fixed agreed price in parts.

## Owns

- Domain types for `POST/GET /credits*` (`model/credit.types.ts`).
- `creditRepository` — the only HTTP caller for `/credits*`.
- `creditKeys` — the query-key factory (list/detail/contract/report).
- Read hooks: `useCredits`, `useCredit`, `useCreditContract`, `useCreditReport`.
- `lib/credit-plan.ts` — pure plan arithmetic (even split with the remainder on
  the last part, "left to plan", the limit check, UTC-day past-due) + spec.
- `ContractPaper` — the printable no-interest contract, built like the receipt.

## Public API

Everything re-exported from `index.ts`. Never import a deep path.

## Must never

- Show or compute interest, a late fee or a penalty — there is none.
- Hold a credit mutation here: creating a credit and taking/refunding payments
  invalidate other entities' keys, so those hooks live in the feature layer
  (`features/pay-on-credit`, `features/credit-payment`).

## Open questions

None.
