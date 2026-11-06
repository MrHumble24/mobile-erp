# Features/Orders — online storefront orders

Staff view and act on orders placed from the public shop page (ADR 0049, 0050;
handoff 029). A More-tab screen gated on `order.read`, with a NEW-order badge.

## Owns
- `Data/` — `OrdersRepository` (the only caller of `/storefront-orders[/:id|/stats]`)
  and the `StorefrontOrder*` decodable shapes + the status-change body.
- `Lib/` — pure, DEBUG self-checked (`OrderRulesSelfCheck`): `OrderRules` (which
  actions a status + `order.manage` allow), `OrderTimeAgo` (how-long-ago buckets),
  `OrderSpecs` (the variant line).
- `Model/` — `OrdersListModel` (status filter + paging) and `OrdersBadge` (the
  shared NEW count for the More-tab badge).
- `UI/` — `OrdersView` (chips, list, pull-to-refresh), `OrderDetailSheet` (header
  with dialable phone, note, handler, status actions, history), `OrderStatusStyle`.

## Public API
`OrdersModule.feature` — the one line registered in `FeatureRegistry`.
`OrdersBadge.shared` — read by `MoreTab` for the badge.

## Must never do
- Cache orders or queue a status change. Online only: offline → the kit offline
  state; a status change needs the network.
- Decide a transition rule. The server owns NEW → CONTACTED → DONE and
  NEW/CONTACTED → CANCELLED; the UI only offers buttons and shows refusals.
- Send a cancellation note — the server status body takes `statusCode` only.

## Open questions
- None. Creating orders, sale conversion and push notifications are out of scope.
