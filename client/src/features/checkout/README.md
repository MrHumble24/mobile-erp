# checkout

The sale cart: a multi-line draft that turns scanned devices into `POST /sales` calls.

## Owns
- `cart.store.ts` — Zustand (persisted under `mobile-erp-pos-cart`, v1): a list of
  `CartLine` — a discriminated union of `UnitCartLine` (a phone/serial device, priced
  whole, with warranty) and `QuantityCartLine` (a counted product: `modelId`, editable
  `unitPrice` per piece, `quantity`, `onHand` for the over-stock warning; no warranty,
  ADR 0030). Plus one shared `customer` and the cart-wide `paymentMethod` + `splitParts`.
  Each line keeps its own `clientMutationId` so a retry is idempotent.
- `lib/line-total.ts` — `lineTotal(line)` (unit price, or `unitPrice × quantity` in
  cents); `payment.ts`'s `toLinePrices` projects a mixed cart onto the id+total the
  split maths needs, so Cash/Card/Split work across phones and quantity lines alike.
- `use-checkout.ts` — mutation that submits lines sequentially, one `POST /sales` each.
  Succeeded lines are removed as they complete; the first failure stops and throws
  `CheckoutLineError` (which IMEI, status code, already-succeeded sale ids).
- UI: `CartLines`, `CartLine`, `PriceGuidance`, `CustomerPanel`, `CustomerSearch`,
  `NewCustomerForm`, `TotalsPanel`, `PaymentPanel`, `CheckoutReceiptModal`.
- `lib/to-sale-dto.ts`, `lib/line-blockers.ts`, `lib/payment.ts` — pure mappers/rules.
  `payment.ts`'s `buildCartPayments` turns the cart's method + split parts into each
  line's `payments` (`cash` → omitted, `card` → one CARD line, `split` →
  `allocateSplit`); `isPaymentBlocked` stops an unbalanced split checking out. Tested
  in `lib/payment.spec.ts`.

## Exposes (index.ts)
`useCartStore`, `useCheckout`, `isLineBlocked`, `isPaymentBlocked`, `CartLines`,
`CustomerPanel`, `TotalsPanel`, `CheckoutReceiptModal`, and cart/checkout types.

## Must never
- Import another feature (auth, consign-device). Permissions and the cashier id are
  passed in as props from the widget.
- Hold server lists in Zustand — only the cart draft lives here.

## Offline
On a transport failure (not a 4xx/5xx), `use-checkout` enqueues the line via
`entities/sync` (same `clientMutationId`), clears the line, and returns
`queuedCount`; the POS shows a "queued" toast. A unit line carries its device
`version` as `baseVersion`; a quantity line carries none (no device lock, never
conflicts, ADR 0030).

## Payment
The cashier picks Cash, Card or Split (`PaymentPanel` → `entities/ledger`'s
`PaymentMethodField`). Split divides the whole **cart total** into one amount per
account (cash X, card Y, X + Y = total). At checkout `allocateSplit` walks the
phones in cart order and pays each from the parts in order (cash until used up,
then card), cent-exact; a phone that straddles the boundary gets two payment
lines, every other phone one, and each sale's `payments` sums to its own price.
The same allocation feeds the offline outbox, so a queued split survives reload.

## Open questions
- Below-cost confirm only fires when the user can see cost (`device.cost.view`).
