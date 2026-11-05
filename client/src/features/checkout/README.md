# checkout

The sale cart: a multi-line draft that turns scanned devices into `POST /sales` calls.

## Owns
- `cart.store.ts` — Zustand (persisted under `mobile-erp-pos-cart`): a list of `CartLine`
  `{ lineId, device, salePrice, warrantyDays, notes, clientMutationId, belowCostConfirmed }`
  plus one shared `customer`, plus the cart-wide `paymentMethod` + `splitParts`. Each line
  keeps its own `clientMutationId` so a retry is idempotent per device.
- `use-checkout.ts` — mutation that submits lines sequentially, one `POST /sales` each.
  Succeeded lines are removed as they complete; the first failure stops and throws
  `CheckoutLineError` (which IMEI, status code, already-succeeded sale ids).
- UI: `CartLines`, `CartLine`, `PriceGuidance`, `CustomerPanel`, `CustomerSearch`,
  `NewCustomerForm`, `TotalsPanel`, `PaymentPanel`, `CheckoutReceiptModal`.
- `lib/to-sale-dto.ts`, `lib/line-blockers.ts`, `lib/payment.ts` — pure mappers/rules.
  `payment.ts` turns the cart's method + split parts into each line's `payments`
  (`cash` → omitted, `card` → one CARD line, `split` → the parts) and exposes
  `isPaymentBlocked` so an unbalanced split cannot check out.

## Exposes (index.ts)
`useCartStore`, `useCheckout`, `isLineBlocked`, `isPaymentBlocked`, `CartLines`,
`CustomerPanel`, `TotalsPanel`, `CheckoutReceiptModal`, and cart/checkout types.

## Must never
- Import another feature (auth, consign-device). Permissions and the cashier id are
  passed in as props from the widget.
- Hold server lists in Zustand — only the cart draft lives here.

## Offline
On a transport failure (not a 4xx/5xx), `use-checkout` enqueues the line via
`entities/sync` (same `clientMutationId`, device `version` → `baseVersion`),
clears the line, and returns `queuedCount`; the POS shows a "queued" toast.

## Payment
The cashier picks Cash, Card or Split (`PaymentPanel` → `entities/ledger`'s
`PaymentMethodField`). Split is offered only for a single-line cart (one price to
divide); a stale split on a multi-line cart resets to cash. The chosen tender rides
in each line's `payments`, so an offline-queued sale keeps its split.

## Open questions
- Multi-line split is deliberately out: one shared split across several sales would
  have to re-allocate per line to each sale's price. Add when the shop asks for it.
- Below-cost confirm only fires when the user can see cost (`device.cost.view`).
