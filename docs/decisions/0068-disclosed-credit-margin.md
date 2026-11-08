# 0068 — One disclosed, fixed margin on customer credit (Murabaha)

Date: 2026-11-08
Status: Accepted

## Context

ADR 0035 shipped "Muddatli to'lov" as an interest-free instalment sale: the
agreed price equals the normal cash checkout price, is split into frozen parts,
and never grows. There is no interest, late fee or penalty column anywhere.

The store also wants to sell on instalments at a price **a little higher than
cash**, in an Islamic-compliant way (Murabaha / bay' mu'ajjal): the cash price
plus **one margin disclosed and agreed up front**, forming a single fixed price.
That is not *riba*: nothing accrues with time, nothing is added for paying late,
and the price never increases after the contract is signed.

Constraints found in the code:

- `agreedTotal` is derived entirely from `Σ Sale.salePrice` of not-returned
  sales (`credits/lib/credit-math.ts`); `customerOutstanding()` sums the same
  column for the credit-limit gate.
- `assertPlanAddsUp` requires `down payment + Σ instalments === cartTotal`
  exactly, with no tolerance.
- The global `ValidationPipe` uses `forbidNonWhitelisted: true`, so a new field
  must be declared in the DTO.
- `SaleDiscountDto.value` has `@Min(0)`; a raised price is only accepted with
  `sale.price.override`. A markup must therefore not depend on that permission.

## Decision

1. **`CreateCreditDto.markupAmount?: number`** (`@Min(0)`, 2dp). Optional;
   omitted/`0` keeps the classic interest-free sale, so Android/iOS and older
   clients are unaffected. Lines are still sent at their normal **cash** price.
2. **`CustomerCredit.markupAmount`** column (`DECIMAL(14,2) NOT NULL DEFAULT 0`)
   stores the frozen, disclosed margin (migration
   `20261108140000_credit_markup`). It is disclosure/audit data only — no
   interest, late fee or penalty field is added.
3. The **server** validates `markupAmount ≤ Σ line cash prices`, splits it
   proportionally in integer cents (`lib/credit-markup.ts`, remainder on the
   last line) and folds each share into that line's `Sale.salePrice` **after**
   the normal cash pricing has run (`SalesCreditService.checkoutLine`). Hence:
   - no `sale.price.override` is needed — any `sale.credit` holder can sell;
   - `cartTotal = cash price + margin`, and the plan/down payment must equal it;
   - the credit-limit gate sees the full agreed debt;
   - `agreedTotal`, `paid`, `outstanding`, `settled` and returns stay **unchanged**
     — a returned sale drops out together with its margin share.
4. `CreditView` and `CreditContract` expose `cashPrice` (derived as
   `agreedTotal − markupAmount`) and `markupAmount`. `CONTRACT_TERMS` states one
   disclosed margin and that the agreed price never increases. `ContractPaper`,
   the credit detail and the success view print the breakdown.
5. **Client** (`CreditStep`, the full-screen POS step): optional margin entered
   as a **percentage of the cash price or a fixed sum** (a toggle that preserves
   the amount when switched), capped at the cash price, with the resulting
   agreed price shown live. Changing the margin **rebalances the plan**
   (`useCreditDraft`) so the cashier cannot sell a stale total. Both modes and
   the disclosure are shown before confirming.
6. **Still forbidden**: interest, late fees, penalties, compounding, any
   time-based growth, or rescheduling that raises the price. The margin is set
   once at creation. `credit.noInterest` copy was clarified ("never grows
   *later*").
7. i18n: new `credit.*` keys in **both** `uz/` and `en/`; new GLOSSARY term for
   the agreed margin (see the Uzbek-copy caveat below).

### Verification

```sh
cd server && npx prisma generate && npx prisma migrate deploy
cd server && npx nest build && npx jest src/credits
cd client && npx tsc -b && npm test && npm run build
```

## Consequences

- `Sale.listPriceSnapshot − Sale.salePrice` is **negative** for a marked-up
  line, so discount reports show a negative discount on those sales. The sale
  price genuinely is cash + margin, and gross profit (`salePrice − landedCost`)
  correctly includes the margin. No ledger change: money still flows only
  through `CREDIT_PAYMENT` rows for the full agreed price.
- A margin consumes credit-limit headroom (the customer owes more), which is
  intended and is enforced by the existing gate.
- `cashPrice = agreedTotal − markupAmount` is exact at creation. After a
  **partial return**, the returned sale's price (including its margin share)
  leaves `agreedTotal` while `markupAmount` stays frozen, so the derived cash
  price becomes a disclosure approximation. All money arithmetic stays exact.
- The shared `Json` on Android uses `ignoreUnknownKeys = true` and iOS uses
  `Codable`, so the new response fields do not break either client.

### Out of scope

- A shop-wide default margin rate in settings (the margin is per agreement).
- Manual per-line allocation of the margin; it is always proportional.
- The native **entry** UI for the margin: the mobile DTOs carry the new response
  fields, but Android/iOS still create interest-free credits (field omitted).
  The web till is the primary terminal and is the only client that offers it.
- Uzbek copy for the new keys was written as standard functional terms; it
  should be reviewed through `docs/handoffs/gemini/` per the project rule that
  merchant-facing Uzbek is produced by Gemini, not by coding agents.
