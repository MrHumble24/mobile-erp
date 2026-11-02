# consignments slice

Consignment lifecycle: list (Out / Overdue / All), consign a device, settle,
return. Mirrors the web `consignments` page + `consign-device` /
`settle-consignment` features.

## Owns
- Tabbed list (online reads — consignments are not in `/sync/changes`).
- The three **offline-capable** money-path writes via `ConsignmentWriter`.

## Public API
- `consignments_module.dart` → `consignmentsRoutes`, `consignmentsNavItems`
  (route `/consignments`, perm `consignment.read`).

## Offline writes (FOUNDATION §offline)
`ConsignmentWriter` is the only writer. Online → REST; offline (or a network
failure mid-call) → `OutboxDao.enqueue` with the matching server type, then a
best-effort `syncNow()`:
- `consignment.create` — outbox id == `clientMutationId` (idempotent retry);
  `baseVersion`/`expectedVersion` = the cached device version.
- `consignment.settle` / `consignment.return` — payload carries `consignmentId`
  (the queue has no path param); `baseVersion` = cached device version.

## Must never do
- Edit `data/local/` or another slice. Device version + partner picker read the
  shared Drift DAOs directly; nothing mutates those tables.

## Open questions
- Offline create is enqueued but not shown in the list until the next pull (no
  local consignment cache). The server's credit-limit error body
  (`creditLimit/outstanding/projected`) is surfaced as its plain message only.
