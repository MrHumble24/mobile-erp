# sync

Offline mutation queue, conflict resolution, and the offline-cache feed (PRD §5).

## HTTP (all under `/sync`)

- `POST /push` — authenticated (no permission code); each mutation is checked
  individually. Body `{ terminalId, mutations: [{ id (=clientMutationId), type,
  payload, baseVersion?, occurredAt }] }`. Processed **in order**. Per mutation:
  permission check (`sale.create` / `consignment.create` / `consignment.settle`)
  → DTO validation → dispatch to the owning service with `clientMutationId = id`,
  `expectedVersion = baseVersion`. Result status: `applied` | `duplicate` (replay)
  | `conflict` (ConflictException → a `sync_conflicts` row) | `rejected` (403 /
  invalid / other error — **never persisted**). Response `{ results: [...] }`.
- `GET /conflicts` (`sync.resolve`) — pending (`resolvedAt` null) with device
  imei, terminal, attemptedChange.
- `POST /conflicts/:id/resolve` (`sync.resolve`) — `{ resolution:'keep-server' |
  'apply-terminal', note? }`. keep-server records the decision; apply-terminal
  re-dispatches the stored mutation at the device's current version and, if it
  still clashes, returns 409 and leaves it pending. No force path (ADR 0011).
- `GET /changes?since=` (`device.read`) — `{ serverTime, nextSince, devices[],
  partners[] }`. Devices changed since `since` (cap 2000, `nextSince` to page);
  **no cost fields are selected at all**. Partners (with `creditLimit`/`outstanding`)
  are returned only when the caller holds `partner.read`; otherwise `partners: []`.

## Structure

One handler per mutation type in `handlers/`, keyed by `SyncHandlerRegistry`
(no switch chains). Reads/writes for conflicts + the feed live in `sync.repository.ts`
and `sync-changes.repository.ts`.

## Must never

Inject another module's repository (uses `SalesService` / `ConsignmentsService` /
`PartnersService` only); persist a rejected mutation; select `acquisitionCost` /
`landedCost` in the changes feed.
