# credits

Customer credit, the Islamic way — **no interest, ever** (Change 6, ADR 0035).
A named customer with a phone takes a cart now and pays the fixed agreed price
in parts. Owns `customer_credits`, `credit_instalments`, `credit_payments`.

## HTTP

- `POST /credits` (`sale.credit`, ADMIN only by default) — create a credit over
  a cart. Body `{ customerId, lines[], payments?[{accountCode,amount}],
  instalments[{dueDate,amount}], note?, clientKey? }`. Each `line` is exactly
  what `POST /sales` takes for one sale (`imei` | `serialNumber` | `modelId`+
  `quantity`, `salePrice`, `priceLevelCode?`, `discount?`, `warrantyDays?`).
  In one transaction every line is checked out through the normal sale path
  (same pricing/stock rules) posting **no SALE rows**, then the credit,
  instalments and down payment (`CREDIT_PAYMENT` rows) are written. 400 when
  credit is disabled, the plan + down payment ≠ cart total, an instalment is
  non-positive or past-due, the customer has no phone, or the new debt exceeds
  the limit. Idempotent on `clientKey`. → `CreditView`.
- `GET /credits?customerId&status=open|overdue|settled` (`sale.read`) →
  `CreditListItem[]`.
- `GET /credits/:id` (`sale.read`) → `CreditView` (sales, plan with paid +
  overdue, payments, agreedTotal/paid/outstanding/overpaid/overdueAmount/settled).
- `GET /credits/:id/contract` (`sale.read`) → `CreditContract` — store identity,
  customer, goods with codes + prices, down payment, instalments, and the plain
  statement that no interest or late fee applies. Everything a client prints.
- `GET /credits/report` (`report.finance`) → totals outstanding/overdue + the
  customers behind them.
- `POST /credits/:id/payments` (`sale.create`) `{ amount, accountCode }` — a
  later payment at the till (cash/card); rejected above outstanding. One
  `CREDIT_PAYMENT` row. → `CreditView`.
- `POST /credits/:id/refund` (`sale.return`) `{ amount, accountCode }` — pay
  back an overpayment after a return as a negative `CREDIT_PAYMENT`, capped at
  the overpaid amount. → `CreditView`.

## Invariants (all derived, never stored — `lib/credit-math.ts`)

- agreed total = Σ sale prices of not-returned sales; paid = Σ payments;
  outstanding = agreed − paid; settled = outstanding ≤ 0 (no status column).
- Payments allocate to instalments in due-date order; an instalment is overdue
  when past due and not fully covered.
- Effective limit = customer `creditLimit` else settings `defaultCreditLimit`;
  null = no cap. The cap is on principal — **there is no interest**.

## Must never

- Add any interest, late-fee or penalty field/code. Store a balance. Write a
  second checkout path — credit lines reuse `SalesCreditService`. Let an offline
  till create a credit (the limit must be checked): online only.
