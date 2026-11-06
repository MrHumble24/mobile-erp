# features/sales — POS & Sales slice group

Native port of the web `pages/pos`, `pages/sales`, `pages/customers`,
`features/checkout`, `entities/sale`. One `FeatureModule` (`SalesFeature`),
three permission-gated routes (`pos`, `sales`, `customers`).

## Owns
- **POS**: scan into a multi-device cart (confirm sheet, never silent add),
  shared customer, discounts (ADR 0034), trade-ins (ADR 0039), bonus points
  (ADR 0043). Checkout fans out one `sale.create` per device via the outbox;
  a cart with points or trade-ins is posted directly, never queued.
- **Sales**: filtered/paginated list, stats, warranty lookup, detail sheet,
  receipt, return. Returns map server codes to translated text (ADR 0044).
- **Customers**: list, detail, bonus balances and points corrections.

## Step 11 (ADR 0043/0044/0047/0060)
- Points use `shared/lib/Points.kt` (numbers, never money); the plan is
  `lib/BonusRedeem.kt` on top of the trade-in plan, in cart order.
- Receipts show the server shop name and points lines (`lib/ReceiptRows.kt`);
  the till's own receipt shows points spent, earned only on the sale receipt.
- Print exists only while receipt printing is on, at 58 or 80 mm. Price
  tags are not on the phones.

## Public API
- `SalesFeature : FeatureModule`. Integrator adds `SalesFeature,` to
  `FeatureRegistry.features`.

## Must never
- Edit foundation or another slice; queue a points/trade-in sale offline;
  compute points earned on the phone (the server owns them).

## Depends on
- `features/purchases` (used-unit form), `features/inventory` (models).
