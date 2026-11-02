# sync slice

Surfaces the offline sync engine to the user. The engine itself (push drain,
pull, conflict fetch/resolve) lives in `data/sync/` and is unchanged here.

## Exposes
- `syncRoutes` / `syncNavItems` (`/sync`, `nav.sync`) — registered in `feature_registry.dart`.
- `SyncScreen` — manual "sync now", the live offline outbox queue, and (for a
  `sync.resolve` user) the server conflict inbox with keep-server / apply-terminal.
- `outboxQueueProvider` (live `outbox` rows), `conflictsProvider` (`GET /sync/conflicts`).

## Must never
- Hold business/write logic — it only reads the outbox and calls
  `SyncController.syncNow()` / `ConflictStore.resolve()`.
- Re-implement the sync protocol; that is owned by `data/sync/`.

## Open
- Conflict row shape is server-owned (`Map`); only `id`/`type` are displayed.
- `sync.resolve` resolutions assumed: `keep-server`, `apply-terminal`.
