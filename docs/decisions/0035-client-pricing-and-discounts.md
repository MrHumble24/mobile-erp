# 0035 — Web client: price levels and discounts

Date: 2026-11-05
Status: Accepted

## Context

ADR 0034 added three price levels and discounts to the server. The web client
had to show and set prices, follow the customer's level, apply bounded discounts
at the till, and surface it all in sales/receipts/reports — inside FSD, where a
feature may not import a sibling feature and an entity may not import a sibling
entity.

## Decision

- **One pricing entity, inline price shapes elsewhere.** `entities/pricing` owns
  the `LevelCode`/`Discount` types, the `/pricing` repository + hooks, and the
  pure checkout money rules (`lib/discount.ts`, integer cents, half-up, mirrored
  from the server and spec-tested). The resolved `prices{RETAIL,WHOLESALE,PARTNER}`
  on reads is re-declared inline on `device`/`catalog`/`stock` (structurally
  identical) because entities cannot import each other — the same precedent as
  `catalog`'s local `ProductKind`.
- **The till stops the cashier before the server.** `discountError` returns the
  `pricing.error*` key; a server 400 is mapped back to the same keys, a price
  mismatch refreshing the line. The cart holds the level + per-line list prices,
  discount and override; prices are **derived** from the level, never stored.
- **A whole-cart discount spreads into per-line AMOUNT discounts** (largest-
  remainder, cent-exact in `cart-discount.ts`) since the server only knows lines.
- **Price-setting UI lives in the slice that owns the form**, not a new feature:
  the product grid in `manage-device-model`, the unit fields in the `device-drawer`
  widget, each gated by `price.manage` threaded from the page/widget (features
  cannot read auth or compose features).

## Consequences

- The three-key price shape is duplicated as a type in four slices; it changes
  for one reason (the server contract), so the duplication is low-risk and FSD-legal.
- Checkout math is tested once in `entities/pricing`; the cart composes it. The
  cart-discount spread keeps each line's percent ~equal, so a cart percent within
  the cap stays within the cap per line (rounding can graze it; the server tolerates).
