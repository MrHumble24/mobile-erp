# sync

Offline mutation queue, conflict resolution, and offline-cache feed (PRD §5).

## HTTP (`/sync`)

- `POST /push` — body `{ terminalId, mutations: [{ id, type, payload, storeId?, baseVersion?, occurredAt }] }`.
  Validates `storeId` against caller stores (`STORE_FORBIDDEN` / `STORE_REQUIRED`), wraps execution
  in store context. Dispatches to owning handler; returns `{ results: [{ id, status, record?, error? }] }`.
  A mutation whose `occurredAt` is before the last erase/restore (the session cutoff, ADR 0057) is
  rejected `MUTATION_BEFORE_RESET` so it is not replayed into the clean shop; the client drops it.
- `GET /conflicts` (`sync.resolve`) — pending conflicts with device, terminal, and attempted change.
- `POST /conflicts/:id/resolve` (`sync.resolve`) — `{ resolution: 'keep-server' | 'apply-terminal', note? }`.
- `GET /changes?since=` (`device.read`) — incremental feed of devices, partners, and quantity products.
  Never returns cost fields (`acquisitionCost` / `landedCost`).

## Structure

- `handlers/` — one handler per mutation type keyed by `SyncHandlerRegistry`.
- `sync.repository.ts` & `sync-changes.repository.ts` — conflict tracking and feed data access.

## Must never

Inject foreign repositories; persist rejected mutations; select cost fields in feed.
