# features/pos — POS terminal (wave 4)

The first **offline-write** path. Scan an IMEI, review the device, check out.

## Owns
- `/pos` route (perm `sale.create`), scanner → cart → checkout → receipt.
- The `sale.create` mutation: payload + outbox builders (`data/sale_create.dart`).

## Public API (via the module)
- `posRoutes`, `posNavItems` — wired in `app/router/feature_registry.dart`.

## Offline model (FOUNDATION §offline)
- Device lookup: Drift `devices` first, then `GET /devices/by-imei/:imei`.
- Checkout builds a `CreateSaleDto` with `clientMutationId = newUuidV4()` and
  `expectedVersion = device.version`. **Online** → `POST /sales`. **Offline**
  (`connectivityProvider`) → `OutboxDao.enqueue` with `type: 'sale.create'`,
  `baseVersion = device.version`, `id = clientMutationId`. The push drain sends it.
- A just-sold device is hidden from a re-scan by reading pending `sale.create`
  rows in the outbox (`pendingSoldImeisProvider`) — read-only, never mutating
  the shared `devices` cache.

## Must never
- Mutate the Drift `devices`/`outbox` schema, write outside this slice, or add a
  printing dependency (receipt Print is a wave-8 stub).

## Deliberately out of scope
- Attaching an **existing** customer (needs an online search; coupling) — the
  form creates an inline customer or sells walk-in. `customerId` is supported in
  the payload for a later UI.
