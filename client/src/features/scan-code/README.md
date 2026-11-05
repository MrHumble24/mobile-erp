# scan-code

One till lookup for any scanned or typed code (ADR 0030). Composes the unit
lookup (entities/device) and the quantity-product lookup (entities/stock) into a
single `ScanLookup` the POS acts on. Units win over barcodes (resolved by the
server `GET /scan/:code`).

## Exposes

- `useScan(code, nonce?)` — React Query hook; enabled for codes ≥ 3 chars,
  never cached (a unit's status must never be stale).
- `scanCode(code)` — the repository, used directly by offline paths.
- `ScanLookup = { kind: 'unit', unit } | { kind: 'product', product } | { kind: 'notFound' }`.

## Must never

- Block a sale on stock levels. Offline, a cache miss reads as not-found.
