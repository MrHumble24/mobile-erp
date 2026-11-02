# 0018 — Client offline sync

Date: 2026-11-02
Status: Accepted

## Context
The bazaar loses internet often. Before this, every POS/consignment write was a
direct mutation that simply errored on a dropped connection. The server sync
layer (ADR 0011, `server/src/sync`) already exists; the client had none.

## Decision
- **Outbox** in IndexedDB (`shared/lib/offline` wrapper, `entities/sync` owns the
  queue). Entries keyed by `clientMutationId`. On a transport failure
  (`NetworkError`, not a 4xx/5xx) or while `navigator.onLine` is false, the four
  mutations (`sale.create`, `consignment.create/settle/return`) enqueue instead
  of failing; the cart line clears and the user sees "queued".
- **Drain** by one engine hook mounted in the app shell: pushes pending entries
  in order to `POST /sync/push` on `online`, on start, and every 30 s while
  pending. `applied`/`duplicate` → delete; `conflict` → delete + count +
  invalidate conflicts; `rejected` → keep + flag, no auto-retry (user retries or
  discards at `/sync`). One module-level lock serialises drains.
- **Device cache**: pull `GET /sync/changes` (paged) into IndexedDB; the
  IMEI lookup in `entities/device` falls back to it offline so the cart carries
  the cached `version`. Refreshed on each drain and every 5 min online.
- **App shell** precached by `vite-plugin-pwa` (autoUpdate, no `/api` runtime
  caching) so a reload offline still boots.

## Consequences
- Offline sales can't check the below-cost floor (the feed omits cost) — allowed.
- Settle/return queue without a `baseVersion` (device version is unknown on the
  consignments screen); the server resolves by device and raises a conflict if
  it clashes. Acceptable: no silent force path (ADR 0011).
- Conflict resolution stays online-only, gated by `sync.resolve`.
- Not offline: auth/login, reports, inventory browsing, anything but the four
  queued writes and IMEI lookup.
