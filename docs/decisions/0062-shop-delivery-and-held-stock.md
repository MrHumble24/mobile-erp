# 0062. Online Shop Delivery, Reservation & Hand-over

## Context
Online storefront (handoff 022) allowed placing orders, but lacked delivery options, fee calculations, stock holds, and automated checkout. Open orders risked selling the same unit at the till.

## Decision
1. **Delivery Configuration**: Extended `storefront_settings` with `pickupEnabled`, `deliveryEnabled`, `deliveryPricingModeCode` (FREE, FLAT, BY_ZONE), `deliveryFlatFee`, `deliveryFreeFrom`, and `deliveryNote`. Managed delivery zones in `delivery_zones`.
2. **Order Price & Fee Freezing**: `priceSnapshot` and `deliveryFeeSnapshot` are frozen on order placement (`POST /storefront/orders`). Status `SHIPPED` added between `CONTACTED` and `DONE` for delivery orders.
3. **Stock Reservation (`RESERVED`)**: Holding stock transitions unit `IN_STOCK` -> `RESERVED`. Partial unique index `storefront_orders_device_held_idx` guarantees at most one open order holds a device. Held devices are excluded from till and transfers, but included in inventory valuations ("owned" vs "sellable").
4. **Order Hand-over**: Staff action `POST /storefront/orders/:id/hand-over` creates sale at snapshot price via `SalesCreateService.create` (permitting `RESERVED` for the holding order), records `DELIVERY_FEE` in cash ledger when fee > 0, and marks order `DONE`.

## Consequences
- Prevents double-selling reserved stock while maintaining inventory balance.
- Atomic handover links sale and posts delivery fee without till pricing discrepancies.
- Online payment integration (handoff 034) builds directly on this holding mechanism.
