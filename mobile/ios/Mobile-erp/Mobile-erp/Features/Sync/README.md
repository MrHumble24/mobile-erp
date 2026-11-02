# Sync slice

Surfaces the offline sync engine to the user — the native port of the deleted
Flutter `features/sync`. The engine (push drain, pull, conflict fetch/resolve)
lives in `Data/Sync/` and is untouched here.

## Owns
- `SyncModule.feature` — nav + route, `permission: nil` (every signed-in user).
- `SyncView` — connectivity + manual "sync now", the live outbox queue
  (pending / conflict / rejected), and the `sync.resolve`-gated conflict inbox
  with keep-server / apply-terminal.
- `SyncModel` — reads `OutboxEntry` rows from `container.modelContext`, calls
  `container.sync.syncNow()` and `container.conflicts()` (fetch/resolve).

## Public API
`SyncModule.feature`.

## Must never
- Hold business or sync-protocol logic; that is owned by `Data/Sync/`.
- Enqueue to the outbox or write any record. Resolving a conflict and syncing
  are online-only and block with a needs-connection message offline.

## Notes
- Conflict row shape is server-owned; only `id` / `imei` / mutation `type` show.
- No `@Query`: the model container is not in the SwiftUI environment, so the
  queue is fetched on appear, on pull-to-refresh, and after each action.
