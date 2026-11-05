# credit (Android)

Customer credit, the Islamic way — **no interest, ever** (Change 6, ADR 0035).
Mirrors the web `entities/credit` + `features/pay-on-credit` + `pages/credits`.
Online only: credit never queues through sync; the server must check the limit live.

## What it owns
- `data/` — `/credits` DTOs, Retrofit `CreditApi`, `CreditRepository`, and
  `CreditCreate` (builds the `POST /credits` body from a priced cart).
- `lib/CreditPlan` — pure, cent-exact plan maths (even split, remaining, limit,
  past-due); `CreditError` maps 400s to `credit.*` keys. Unit-tested.
- `model/` — list, detail (payment/refund) and create view models + the till draft.
- `ui/` — `CreditsScreen` (list, More tab), `CreditDetailSheet`, `OnCreditSheet`
  (the till action), `CreditPlanBuilder`, `CreditPaymentSheet`, shared `CreditSummary`.
- `CreditFeature` — nav route `credits` (perm `sale.read`), registered in
  `FeatureRegistry`.

## Public surface used by other slices
- `OnCreditSheet` + `CreditListRow` + `CreditDetailSheet` are reused by the sales
  slice (till checkout, customer detail). The credit report tab lives in finance.

## Must never
- Add any interest, late-fee or penalty field/code. Store a derived balance.
- Let an offline till create a credit — the "On credit" action is disabled offline.
- Build a second checkout path — credit lines reuse the server's `POST /sales` shape.

## i18n
Namespaces `credit` (+ `shifts` for the gate) are read from the web client's JSON
(registered in `i18n/I18n.kt`). English for now; Uzbek via a Gemini handoff.
