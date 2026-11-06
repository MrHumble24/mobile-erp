# storefront

Online storefront and customer order intake (Change 10, ADR 0049).
Owns `storefront_settings`, `storefront_orders`, `storefront_order_statuses`,
and `storefront_order_status_history`.

## Exposes

- Public REST (`/storefront`, 120/min rate limit):
  - `GET /config` — enabled state, shop name, contacts, active stores, shown categories.
  - `GET /products` — in-stock products across active stores with `priceFrom` / "ask".
  - `GET /products/:modelId` — card details and variants grouped by storage and color.
  - `POST /orders` — places customer pickup order (5/min rate limit, honeypot protected).
- Staff REST (`/storefront/settings`):
  - `GET`, `PUT` (`settings.manage`) — toggle storefront, showPrices, contacts, shown categories.
- Staff REST (`/storefront-orders`):
  - `GET /` (`order.read`) — list orders for active store (`status`, `from`, `to`, `page`, `pageSize`).
  - `GET /stats` (`order.read`) — badge count of NEW orders for active store.
  - `GET /:id` (`order.read`) — order details and status history.
  - `PATCH /:id/status` (`order.manage`) — transition order state (NEW -> CONTACTED -> DONE/CANCELLED).

## Must never

- Expose IMEI, serial number, unit ID, cost (acquisition/landed/customs), supplier, or grade.
- Call `StoresService.currentStoreId()` on public routes (use explicit active store query).
- Return another store's order on staff routes (strict storeId isolation).
