# shared/payments — money accounts & tender (cross-slice)

The one account picker and the one Cash/Card/Split payment control, shared by
every screen where money moves (POS checkout, expenses, partner payments,
shipments). It lives in `shared/` — not in a feature slice — because the slices
that use it (`sales`, `finance`, `nasiya`, `procurement`) never import each
other, so the only place below all of them is `shared/`. Like `shared/lib/Money`,
it carries domain meaning (CASH/CARD accounts) but no slice's state.

## What it owns
- `PaymentSplit.kt` — pure, BigDecimal tender rules (no Android, no HTTP):
  - `parts(method, total, amounts, accounts)` → cart-level `AccountAmount`s.
  - `allocate(linePrices, parts)` → per-line payments. Waterfalls the cart parts
    across the cart lines in order (fill each phone's price from the first part
    until used up, then the next); a phone that straddles the boundary gets two
    lines, every other one. Each line then sums to its own price exactly — what
    `POST /sales` checks — provided the parts sum to the cart total (the "left to
    assign = 0" gate). Used by online checkout **and** the offline outbox payload.
  - Unit-tested in `test/.../shared/payments/PaymentSplitTest.kt`.
- `AccountOption` + `accountLabelKey` + `canonicalOrder` (CASH, CARD, then rest).
- `AccountsApi` / `AccountsRepository` — `GET /ledger/balances` → options, with
  `balance.read`; otherwise the two known codes `CASH`/`CARD`.
- `ui/AccountPicker.kt` — the labelled picker + `rememberAccountOptions(container)`.
- `ui/PaymentMethodField.kt` — the Cash/Card/Split control + `PaymentSelection`
  (per-account split text, live "left to assign", split-adds-up validity).

## Must never
- Hold a slice's state, or know what a "device"/"expense"/"shipment" is.
- Open a second OkHttp client — uses `container.retrofit.create(...)`.

## Server gap (noted, not fixed here)
`GET /ledger/balances` needs `balance.read`; cashiers lack it, so they get the
CASH/CARD fallback. A small permission-free accounts endpoint would let cashiers
see any non-default accounts too.
