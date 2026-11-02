# Pos slice

POS terminal: scan an IMEI → resolve the device → checkout.

## Owns
- Device scan + gate (exists, IN_STOCK, not already queued offline).
- Checkout: online `POST /sales`, or offline enqueue of `sale.create` to the
  outbox with `expectedVersion` = scan-time device version (ADR 0007).
- The post-sale 58mm receipt (built from local data; copy + system print).

## Public API
- `PosModule.feature` — the one registry line. Permission: `sale.create`.

## Must never
- Mutate the shared device cache (a pending sale is tracked via the outbox).
- Enqueue anything but `sale.create`; every other write is online-only.
- Import another feature slice (the print helper is duplicated on purpose).
- Read cost fields — none are modelled here.

## Offline
- Device lookup is cache-only (`DeviceEntity` by IMEI). A device not yet synced
  reads as "not found"; a sync refresh brings new stock in.
- Checkout queues to the outbox and the receipt renders with a "pending" badge.

## Notes
- `pos.alreadyQueued` has no web i18n key yet (English fallback shown).

## Note
- Named `Pos.README.md` (not `README.md`) to avoid a synchronized-group bundle
  resource basename collision; see the Sales slice note.
