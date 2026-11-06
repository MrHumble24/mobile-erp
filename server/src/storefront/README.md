# storefront

Online storefront and customer order intake (Change 10, ADR 0049, ADR 0062).
Owns `storefront_settings`, `storefront_orders`, `storefront_order_statuses`,
`storefront_order_status_history`, `delivery_zones`, `delivery_pricing_modes`,
`storefront_fulfillment_methods`, and `storefront_payment_methods`.

## Exposes

- Public REST (`/storefront`, 120/min rate limit):
  - `GET /config` — enabled state, shop name, contacts, active stores, shown categories, delivery settings, active delivery zones.
  - `GET /products` — in-stock products across active stores with `priceFrom` / "ask".
    Paged (`page`, `pageSize`); the stock filter runs before paging
    (`storefront-catalog.repository.ts`), so pages are full and never skip a product.
  - `GET /products/:modelId` — card details and variants grouped by storage and color.
  - `POST /orders` — places customer order (PICKUP or DELIVERY with address/zone; 5/min rate limit, honeypot protected). Freezes `priceSnapshot` and `deliveryFeeSnapshot`.
  - `GET /orders/:id` — public order status check (returns safe fields only: id, statusCode, statusLabel, fulfillmentMethod, productName, priceSnapshot, deliveryFeeSnapshot).
- Staff REST (`/storefront/settings`):
  - `GET`, `PUT` (`settings.manage`) — toggle storefront, showPrices, contacts, shown categories, pickup/delivery toggles, pricing mode, flat fee, free-from threshold, delivery note.
- Staff REST (`/storefront/delivery-zones`):
  - `GET`, `POST`, `PUT`, `DELETE` (`settings.manage`) — manage delivery zones (name, fee, sortOrder, isActive). Deletion refused if zone has orders.
- Staff REST (`/storefront-orders`):
  - `GET /` (`order.read`) — list orders for active store (`status`, `from`, `to`, `page`, `pageSize`).
  - `GET /stats` (`order.read`) — badge count of NEW orders for active store.
  - `GET /:id` (`order.read`) — order details and status history.
  - `PATCH /:id/status` (`order.manage`) — transition order state (NEW -> CONTACTED -> SHIPPED -> DONE / CANCELLED). Auto-holds unit on confirm for pay-on-receipt; auto-releases on cancel.
  - `POST /:id/hold` (`order.manage`) — explicitly hold a named in-stock device or oldest available unit for the order.
  - `POST /:id/hand-over` (`order.manage`) — creates sale at frozen `priceSnapshot` for held unit, posts `DELIVERY_FEE` to ledger if fee > 0, and marks order DONE.

## Must never

- Expose IMEI, serial number, unit ID, cost (acquisition/landed/customs), supplier, or grade.
- Expose customer personal data (name, phone, address) on public `GET /storefront/orders/:id`.
- Call `StoresService.currentStoreId()` on public routes (use explicit active store query).
- Return another store's order on staff routes (strict storeId isolation).
- Sell a `RESERVED` unit through the till or transfer it between stores; only the holding order can hand it over.
