# 0059 — Online storefront orders on the phone apps (Android & iOS)

Date: 2026-11-06
Status: Accepted

## Context
The public shop takes orders since ADR 0049/0050; staff handled them on the website
only. The people who call customers are on the shop floor with a phone. Handoff 029
puts the order queue on both phone apps, reusing the server contract unchanged.

## Decision
- **One feature slice per app** (`features/orders` Android, `Features/Orders` iOS),
  registered with one line in each feature registry, gated by `order.read`; status
  buttons gated by `order.manage`. Same server routes as the web: `GET
  /storefront-orders`, `/stats`, `/:id`, `PATCH /:id/status`, scoped by `X-Store-Id`.
- **Online only**: no caching, no outbox. With no connection the list shows the kit
  offline state and a status change is blocked — never fake-queued (FOUNDATION rule).
- **Server owns the rules**: the apps compute which buttons to show from the status +
  permission (`OrderRules`), but never decide a transition; a refusal shows the
  server's message, a 404 closes the detail with a notice.
- **No cancellation note**: the server status DTO takes `statusCode` (+ optional
  `saleId`) only, so the apps send just the code — no note field, despite the handoff's
  guess. The "mark done" sale link is left out of the phones (web-only).
- **NEW-order badge**: a process-wide singleton (`OrdersBadge`) holds the count,
  because each app's nav entry is a static declaration with no live data source. It is
  refreshed when the More tab opens and after a status change.

## Consequences
- Pure logic (allowed actions, how-long-ago) is unit-tested: Android JUnit, iOS a DEBUG
  self-check. The badge is a store-scoped count refreshed lazily, so it can lag until
  the More tab is opened after a store switch — acceptable for a hint.
- Creating orders, converting an order to a sale, and push notifications are out of scope.
