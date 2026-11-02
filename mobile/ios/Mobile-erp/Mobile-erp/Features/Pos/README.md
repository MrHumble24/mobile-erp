# Pos slice

POS terminal: scan IMEIs into a multi-device cart → set per-line terms →
checkout (one sale per device; the server's `CreateSaleDto` takes a single
`imei`, so the cart fans out to one `POST /sales` / one outbox entry per line).

## Owns
- Device scan + gate (exists, IN_STOCK, not already queued offline, not a
  duplicate of a line already in the cart).
- The cart (`PosCart`): lines with price/warranty/notes + one shared customer,
  attached from an existing match (`GET /customers/lookup` typeahead) or added
  inline (name/phone). Existing id and inline name are mutually exclusive.
- Checkout fans out per line: online `POST /sales`, else enqueue `sale.create`
  to the outbox with `expectedVersion` = scan-time device version (ADR 0007).
  A toast reports the count; completed sales open the receipt result sheet.
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
- Each cart line queues its own `sale.create` to the outbox (own
  `clientMutationId` + `expectedVersion`); receipts render with a "pending"
  badge. Customer typeahead is online-only (no attach panel search offline).

## Notes
- `pos.alreadyQueued` / `pos.duplicateDevice` have web i18n keys; the queued
  fallback string is English only.
- Inline NEW customer on a multi-line cart posts the same inline customer per
  line (the server returns no customer id to reuse), so N lines may create N
  customers — attach an existing customer to avoid it. Matches the web.

## Note
- Named `Pos.README.md` (not `README.md`) to avoid a synchronized-group bundle
  resource basename collision; see the Sales slice note.
