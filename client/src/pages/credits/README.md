# page: credits

Route `/credits` (nav `nav.credits`, Finance group, `sale.read`) and the print
view `/credits/:id/contract`. Customer credit, no interest (ADR 0035).

## Owns

- `CreditsPage` — list with status tabs (all/open/overdue/settled) and a
  client-side customer search; each row shows customer, agreed price, paid, left
  to pay and overdue. A row opens the detail sheet.
- `CreditDetailSheet` — goods, plan (each part with paid + overdue), payments,
  and actions: take a payment (`sale.create`), refund an overpayment
  (`sale.return`), print the contract.
- `CreditContractPage` — the printable contract, built like the receipt page.

## Composes

`@/entities/credit` (read hooks, `ContractPaper`), `@/features/credit-payment`
(payment + refund dialogs). Writes never live here.

## Must never

Show interest, a late fee or a penalty — there is none.
