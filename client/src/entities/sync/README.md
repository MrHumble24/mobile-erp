# entities/sync

Owns the offline write queue (outbox) and the sync engine that drains it, plus
conflict reads/resolves. The queue persists in IndexedDB (`shared/lib/offline`);
this slice is the only one that knows mutation types.

## Public API (`index.ts`)
- `enqueueMutation(input)` / `useOutboxStore` — add to and read the outbox.
  `selectPending` / `selectRejected` selectors; status fields `syncing`,
  `lastSyncAt`, `conflictCount`.
- `useSyncEngine()` — mount once in the app shell; drains on start, on `online`,
  every 30s while pending, and pulls the device/partner cache every 5 min.
- `useDrainNow()` — force a push (Retry button).
- `useConflicts()` / `useResolveConflict()` — server conflicts (`sync.resolve`).
- `MUTATION_TYPES` — the four server registry keys.

## Drain rules (see `lib/drain.ts`, pure + tested)
`applied`/`duplicate` → delete; `conflict` → delete + remember conflictId + bump
counter + invalidate conflicts; `rejected` → keep, flag with error, stop
auto-retrying (user retries/discards from `/sync`). Only `pending` entries are
pushed, oldest first. One module-level lock → never two concurrent drains.

## Device + product cache
This slice **writes** the `devices`/`partners`/`products` IndexedDB stores from
`GET /sync/changes`. The cache-aware **reads** live in the owning entities —
`entities/device` (`getCachedDeviceByCode`) and `entities/stock`
(`getCachedProductByBarcode`, ADR 0030) — so a scan falls back transparently
offline. The sides share each row shape structurally, not by import, to respect
the same-layer FSD rule. `products` is the full quantity-product list each sync.

## Must never
Hold server lists in Zustand (counts are derived from the IDB mirror); write
Uzbek; cache cost fields (the feed omits them).

## Note
Invalidation imports sibling entity key factories (sale/device/consignment/
partner/customer) — the established pattern here (`use-consignments.ts` does the
same) over hand-writing key arrays.
