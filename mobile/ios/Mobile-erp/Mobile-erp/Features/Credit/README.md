# Credit (slice)

Customer credit, the Islamic way — **no interest, ever** (Change 6, ADR 0035). A
named customer with a phone takes a cart now and pays the fixed agreed price in
parts. Online only: there is no outbox path.

## Owns / exposes

- `CreditPlan` (`Lib/`): pure, tiyin-exact plan arithmetic mirroring the web
  `credit-plan.ts` — even split (remainder on the last part), "left to plan",
  the limit guard, UTC due dates. A DEBUG `CreditPlanSelfCheck` covers an awkward
  split that sums exactly, the remainder rule, reaching zero, and the limit.
- `CreditError` (`Lib/`): maps a `POST /credits` 400 to a `credit.*` key.
- `CreditRepository` + DTOs (`Data/`): `GET/POST /credits`, `/credits/:id`,
  `/:id/contract`, `/report`, `/:id/payments`, `/:id/refund`, plus the customer's
  credit position from `GET /customers/:id` for the till limit guard.
- `CreditDraft` + `CreditsListModel` (`Model/`): the till draft (down payment via
  the shared `PaymentSelection`, plan rows) and the list filter/search state.
- `CreditModule`: the credits list in the More tab (`sale.read`).
- UI (`UI/`): `CreditSheet` (till: customer summary, down payment, plan, sell,
  result), `CreditPlanBuilder`, `CreditDownPaymentField`, `CreditResultView`,
  `CreditsView` (list), `CreditDetailSheet` + `CreditDetailSections`,
  `CreditPaymentSheet` (take a payment / refund an overpayment), `CreditContractSheet`.

## Consumed by

- `Features/Pos`: the "On credit" action (`PosCreditEntry` builds the lines,
  `CreditSheet` takes the down payment + plan). Online only; disabled offline.
- `Features/Customers`: the credit position on the detail and this customer's
  credits list; the credit-limit field on the form.
- `Features/Reports`: the customer-credit report tab (`CreditReportTab`).
- `Features/Sales`: a credit sale shows a badge; its return shows the no-cash note.

## Must never

- Add any interest, late-fee or penalty field anywhere. Store a derived figure
  (agreed/paid/outstanding/overdue all come from the server). Queue a credit for
  offline replay — credit is online only; the entry point is disabled offline.
