# feature: credit-payment

Money movements on an existing credit (ADR 0035): take a later payment, or pay
back an overpayment after a return. No interest, no fee — only principal.

## Owns

- `TakePaymentDialog` — a later payment (`sale.create`), capped at outstanding.
- `RefundOverpaymentDialog` — refund an overpayment (`sale.return`), capped at
  the overpaid amount.
- `CreditTenderForm` — the shared amount + account form behind both.
- `useAddCreditPayment`, `useRefundOverpayment` — the mutations + invalidation.

## Public API

`TakePaymentDialog`, `RefundOverpaymentDialog`, `useAddCreditPayment`,
`useRefundOverpayment` from `index.ts`.

## Note

Payment and refund are inverse money movements on one credit, so they share one
slice and one form; the caller gates each by its own permission.
