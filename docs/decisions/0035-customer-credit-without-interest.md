# 0035 — Customer credit, the Islamic way (no interest)

Date: 2026-11-05
Status: Accepted

## Context

A walk-in customer may take the goods now and pay the agreed price in parts.
"Islamic way" means no interest: the price is fixed once and nothing is ever
added for paying late (Change 6 in the store-balance plan; not yet in the PRD —
the user owns that file). It must be a setting, off by default, behind its own
permission, with an owner-set credit limit per customer.

## Decision

- **No interest, ever.** There is deliberately no interest, late-fee or penalty
  column, field or code anywhere in the schema, API or logic. The limit caps
  principal only.
- **A credit covers a cart, not a line.** New `credit.prisma`: `customer_credits`
  (store, customer, who, note, idempotent `clientKey`), `credit_instalments`
  (due date, amount) and `credit_payments` (account, signed amount, who). A
  `Sale` gains an optional `creditId`.
- **Nothing derivable is stored.** Agreed total = Σ sale prices of the credit's
  not-returned sales; paid = Σ payments; outstanding = agreed − paid; settled =
  outstanding ≤ 0 (no status column). Payments allocate to instalments in
  due-date order; overdue = past due and not fully covered. One pure function
  (`lib/credit-math.ts`), modelled on the partner balance (ADR 0008).
- **One atomic request.** `POST /credits` runs every line through the **same**
  checkout path a normal sale takes (reused via `SalesCreditService` inside the
  credit's transaction) posting **no SALE rows**, then writes the credit,
  instalments and down payment. Rules: plan + down payment = cart total; each
  instalment positive, due date not past; customer has a phone; idempotent on
  `clientKey`; any line failing rolls back everything.
- **Money.** A credit sale posts no `SALE` ledger rows. Every payment posts one
  `CREDIT_PAYMENT` row (ADR 0025 style) linked by `creditPaymentId`. A later
  payment above outstanding is rejected; a returned credit sale refunds nothing
  (its cap is 0, ADR 0028) and overpayment is paid back as a negative
  `CREDIT_PAYMENT`, capped. Online only — the sync push has no credit handler.
- Setting `customerCreditEnabled` (default false) + `defaultCreditLimit`;
  per-customer `creditLimit` override. Permission `sale.credit` (ADMIN only),
  seeded in the migration and `seed.sql`. Telegram overdue reminder alongside
  the partner one.

## Consequences

- A credit sale has no SALE rows, so reports that sum SALE ledger rows show no
  revenue for it until payments arrive — intended (money in = CREDIT_PAYMENT).
- Cross-credit outstanding/overdue aggregates compute in JS at bazaar scale
  (like customer sale aggregates); upgrade to SQL if volume grows.
