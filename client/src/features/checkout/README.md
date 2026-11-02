# checkout

The sale cart: a multi-line draft that turns scanned devices into `POST /sales` calls.

## Owns
- `cart.store.ts` — Zustand (persisted under `mobile-erp-pos-cart`): a list of `CartLine`
  `{ lineId, device, salePrice, warrantyDays, notes, clientMutationId, belowCostConfirmed }`
  plus one shared `customer`. Each line keeps its own `clientMutationId` so a retry is
  idempotent per device.
- `use-checkout.ts` — mutation that submits lines sequentially, one `POST /sales` each.
  Succeeded lines are removed as they complete; the first failure stops and throws
  `CheckoutLineError` (which IMEI, status code, already-succeeded sale ids).
- UI: `CartLines`, `CartLine`, `PriceGuidance`, `CustomerPanel`, `CustomerSearch`,
  `NewCustomerForm`, `TotalsPanel`, `CheckoutReceiptModal`.
- `lib/to-sale-dto.ts`, `lib/line-blockers.ts` — pure mappers/rules.

## Exposes (index.ts)
`useCartStore`, `useCheckout`, `isLineBlocked`, `CartLines`, `CustomerPanel`,
`TotalsPanel`, `CheckoutReceiptModal`, and cart/checkout types.

## Must never
- Import another feature (auth, consign-device). Permissions and the cashier id are
  passed in as props from the widget.
- Hold server lists in Zustand — only the cart draft lives here.

## Offline
On a transport failure (not a 4xx/5xx), `use-checkout` enqueues the line via
`entities/sync` (same `clientMutationId`, device `version` → `baseVersion`),
clears the line, and returns `queuedCount`; the POS shows a "queued" toast.

## Open questions
- No payment method / split tender (server contract has none).
- Below-cost confirm only fires when the user can see cost (`device.cost.view`).
