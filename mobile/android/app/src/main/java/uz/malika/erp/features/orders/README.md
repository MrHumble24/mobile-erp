# features/orders — online storefront orders

Staff view and act on orders placed from the public shop page (ADR 0049, 0050;
handoff 029). One More-tab entry, gated by `order.read`, with a NEW-order badge.

## Owns
- `data/` — Retrofit `OrdersApi`, `OrdersRepository`, the wire models and the
  `OrderListFilters`. Talks to `GET /storefront-orders`, `/stats`, `/:id`,
  `PATCH /:id/status` through `runApi` (shared error → `AppException`).
- `lib/` — pure, unit-tested: `OrderRules` (which actions a status + `order.manage`
  allow), `OrderTimeFormat` (the "how long ago" buckets), `orderSpecLine`.
- `model/` — `OrdersListViewModel` (status filter + paging), `OrderDetailViewModel`
  (load + status change), `OrdersBadge` (process-wide NEW count for the nav badge).
- `ui/` — `OrdersScreen` (chips, list, pull-to-refresh), `OrderDetailSheet`
  (header, note, handler, history, status buttons), `OrderStatusMeta` (hue + keys).

## Public API
`OrdersFeature` — the one registered line in `FeatureRegistry`; also
`refreshBadge(container)`, called when the More tab opens.

## Must never do
- Cache orders or queue a status change. Online only: no connection → the kit
  offline state; a status change needs the network.
- Decide a transition rule. The server owns NEW → CONTACTED → DONE and
  NEW/CONTACTED → CANCELLED; the UI only offers buttons and shows refusals.
- Send a cancellation note — the server status DTO takes `statusCode` (+ optional
  `saleId`) only.

## Open questions
- None. Creating orders, sale conversion and push notifications are out of scope.
