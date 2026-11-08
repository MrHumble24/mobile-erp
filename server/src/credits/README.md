# credits

Customer credit, the Islamic way — **no interest, ever** (Change 6, ADR 0035;
one disclosed fixed margin, ADR 0068). A named customer with a phone takes a
cart now and pays ONE fixed agreed price in parts. That price may be the cash
price plus one margin agreed up front (Murabaha); it never grows afterwards.
Owns `customer_credits`, `credit_instalments`, `credit_payments`.

## HTTP

- `POST /credits` (`sale.credit`, ADMIN only by default) — create a credit over
  a cart. Body `{ customerId, lines[], payments?[{accountCode,amount}],
  instalments[{dueDate,amount}], markupAmount?, note?, clientKey? }`. Each
  `line` is exactly what `POST /sales` takes for one sale, priced at the normal
  **cash** price. Optional `markupAmount` is one fixed, disclosed margin
  (default 0); the server splits it in cents and folds each share into that
  line's `Sale.salePrice` after the normal pricing, so no `sale.price.override`
  is needed. `cartTotal = cash price + margin`. In one transaction every line
  is checked out through the normal sale path (same pricing/stock rules)
  posting **no SALE rows**, then the credit, instalments and down payment
  (`CREDIT_PAYMENT` rows) are written. 400 when credit is disabled, the plan +
  down payment ≠ cart total, an instalment is non-positive or past-due, the
  margin exceeds the cash price, the customer has no phone, or the new debt
  exceeds the limit. Idempotent on `clientKey`. → `CreditView`.
- `GET /credits?customerId&status=open|overdue|settled` (`sale.read`) →
  `CreditListItem[]`.
- `GET /credits/:id` (`sale.read`) → `CreditView` (sales, plan with paid +
  overdue, payments, agreedTotal/paid/outstanding/overpaid/overdueAmount/settled).
- `GET /credits/:id/contract` (`sale.read`) → `CreditContract` — store identity,
  customer, goods with codes + prices, `cashPrice` + `markupAmount` breakdown,
  `agreedTotal`, down payment, instalments, and the plain statement that the
  margin is disclosed once and no interest or late fee ever applies.
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
- Payments after the down payment allocate to instalments in due-date order
  (plan total − outstanding); overdue = past due and not fully covered.
- Effective limit = customer `creditLimit` else settings `defaultCreditLimit`;
  null = no cap. The cap is on principal — **there is no interest**.
- The limit check reads the customer's outstanding **inside** the write
  transaction after a `FOR UPDATE` lock on the customer row (ADR 0028); a payment
  / refund locks the credit row first, then reads the standing. So two concurrent
  credits (or payments) cannot both slip past the limit on a stale read.

## Cashier shifts (ADR 0036)

`POST /credits` is gated like a sale: when `shiftsEnabled` is on it is rejected
**409 `NO_OPEN_SHIFT`** without an open shift (`ShiftsService.assertCanSell`).
Credit is online only, so there is no `fromSync` exemption.

## The disclosed margin (ADR 0068)

- `CustomerCredit.markupAmount` is a frozen disclosure column, default `0`.
- `lib/credit-markup.ts` splits one margin across cash-priced lines in integer
  cents (remainder on the last line) + spec.
- `Cash price = Σ line cash prices`, `agreed price = cash price + margin`;
  `cashPrice = agreedTotal − markupAmount` on reads. Returns lower the debt by
  the returned sale's whole price (including its margin share).
- `GET /credits*` and the contract expose `cashPrice` + `markupAmount` for the
  printed breakdown. No standing or ledger arithmetic changed.

## Must never

- Add any interest, late-fee or penalty field/code, or any price that grows
  with time. A single margin frozen at creation is the only allowed extra.
- Store a balance. Write a second checkout path — credit lines reuse
  `SalesCreditService`. Let an offline till create a credit (the limit must be
  checked): online only.
