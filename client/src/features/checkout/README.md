# checkout

The sale cart: a multi-line draft that turns scanned devices into `POST /sales` calls.

## Owns
- `cart.store.ts` — Zustand (persisted under `mobile-erp-pos-cart`, v2): a list of
  `CartLine` — a discriminated union of `UnitCartLine` and `QuantityCartLine`. Each line
  now carries its resolved `listPrices` (per level), a per-line `discount`, and an
  `overrideActive` flag; the cart has a `priceLevelCode` (ADR 0034). Plus one shared
  `customer` (with its level + standing discount) and the cart-wide `paymentMethod` +
  `splitParts`. `setCustomer` sets the level from the customer and prefills its standing
  discount; `setPriceLevel` re-prices every line (prices are derived, not stored);
  `applyCartDiscount` spreads a whole-cart discount into per-line AMOUNT discounts.
- `lib/line-pricing.ts` — pure: `lineListCents`, `lineFinalPrice` (list − discount, or
  the typed price when there is no list / an override), `toLinePrices`, `cartTotals`.
- `lib/cart-discount.ts` — `spreadCartDiscount` (cent-exact largest-remainder), tested
  in `cart-discount.spec.ts`. The list-price/discount money rules live in
  `entities/pricing` (`discount.ts`), mirroring the server.
- `use-checkout.ts` — submits lines sequentially; sends `priceLevelCode`, `discount` and
  (for offline replay) `listPrice` per line; the first failure throws `CheckoutLineError`.
- UI: `CartLines`, `CartLine`, `QuantityCartLine`, `LinePriceSection`, `DiscountControl`,
  `CartDiscountControl`, `PriceLevelControl`, `PriceGuidance`, `CustomerPanel`,
  `CustomerSearch`, `NewCustomerForm`, `TotalsPanel`, `PaymentPanel`, `CheckoutReceiptModal`.
- `lib/to-sale-dto.ts`, `lib/to-credit-line.ts`, `lib/line-blockers.ts`, `lib/payment.ts`
  — pure mappers/rules. `payment.ts`'s `buildCartPayments`/`allocateSplit`/`isPaymentBlocked`
  work on the final amounts-to-pay; tested in `lib/payment.spec.ts`. `to-credit-line.ts`
  maps a cart line to the `CreditLineDto` the credit flow sends (same price as a sale).
- `ui/CompactCartLines.tsx` + `ui/CartLineRow.tsx` — a dense, scrollable cart list; each
  row's full editor lives in a popover (ADR 0034 cart-column fix), used by the pinned
  catalog-mode column.

## Exposes (index.ts)
`useCartStore`, `useCheckout`, `isLineBlocked`, `isPaymentBlocked`, `toLinePrices`,
`lineFinalPrice`, `lineListCents`, `lineHasList`, `cartTotals`, `toCreditLine`,
`toCreditLines`, `CartLines`, `CompactCartLines`, `PriceLevelControl`,
`CartDiscountControl`, `CustomerPanel`, `TotalsPanel`, `CheckoutReceiptModal`, and
cart/checkout types.

## Pricing (ADR 0034)
Each line shows its list price for the cart's level. When a list price exists the price
field is read-only (only `sale.price.override` gets a "type a price" toggle); a line with
no list price at any level keeps the old typed-price behaviour. A per-line discount
(percent/amount, as the settings allow, with preset buttons) is stopped before the server:
`entities/pricing`'s `discountError` surfaces `errorDiscountTooHigh`/`errorDiscountAboveList`.
A whole-cart discount is a convenience that spreads into per-line AMOUNT discounts.

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
