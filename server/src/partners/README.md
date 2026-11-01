# partners

B2B partner directory, balances, ledger and payments (PRD Module 4).

## Owns

- `partners`, `partner_payments` tables.
- The derived balance per partner: `outstanding`, `openCount`, `overdueCount`.

## Exposes (HTTP, all under `/partners`)

- `GET /` — `partner.read`. List with balance fields.
- `GET /:id` — `partner.read`. One partner with balance fields.
- `GET /:id/ledger` — `partner.read`. Chronological consignment charges,
  RETURNED reversals and payment credits with a running balance.
- `POST /` — `partner.manage`. Create.
- `PATCH /:id` — `partner.manage`. Update / deactivate.
- `POST /:id/payments` — `partner.payment`. `{ amount>0, consignmentId?,
  paidAt?, notes? }`; `receivedById` = current user.

`PartnersService.assertWithinCreditLimit(partnerId, agreedPrice)` is the public
method the consignments module injects for the credit-limit gate.

## Invariants

- **Balance is derived, never stored** — computed in one SQL aggregate
  (`partners.repository.ts`), never a JS loop over consignment rows.
- `outstanding = Σ agreedPrice (status ≠ RETURNED) − Σ payment.amount`.
- Credit limit 0 means "unlimited"; the rule only fires when `creditLimit > 0`.

## Must never

- Store a balance column, or inject another module's repository.
