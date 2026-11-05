# 0032 — Client unit-code helper and catalog UI

Date: 2026-11-05
Status: Accepted

## Context

The web client caught up to the server's product kinds and serial units (ADR
0029). A unit now shows an IMEI *or* a serial number, and the two sibling
entities that render a code (`sale`, `consignment`, `sync`, `qc`) cannot import
each other under FSD.

## Decision

- The one display helper `unitCode({imei?,serialNumber?})` lives in
  `shared/lib/unit-code.ts` — a structural formatter (no entity import), the only
  place that may hold it so every slice, including sibling entities, shares it.
  Write-side classification (`codeToIdentifier`, `isSerial`, `normalizeSerial`)
  stays in `entities/device/lib/unit-code.ts`; features/widgets/pages reach it.
- Scan and search fields accept any code ≥3 chars (no 15-digit gate); the raw
  code goes to the by-code lookup (server resolves imei/imei2/serial). A typed
  code for a *write* (consignment, offline sale) is classified: a valid IMEI →
  `imei`, else `serialNumber` (normalized). The offline outbox carries whichever.
- Product form: kind stays **editable on edit** (no client unit count); a 409
  whose message mentions "kind" → `catalog.kindLocked`. Barcode vs name 409 share
  one server message, so a just-entered/changed barcode is guessed as the barcode
  clash, else name. Categories are a separate feature (`manage-product-category`)
  rendered as an inventory tab, so no feature imports another.
- Offline devices cache re-keyed from `imei` to `id` (serial units have no imei):
  IndexedDB bumped to v2, store recreated, by-code read scans imei/imei2/serial.

## Consequences

- `GET /sales?search=<serial>` matches IMEI + customer only (server gap), so the
  sales list does not find a sale by serial; by-code warranty/POS/QC lookups do.
- Quantity-stock keys in `catalog` wait for the next task; only `sortOrder` was
  added here.
