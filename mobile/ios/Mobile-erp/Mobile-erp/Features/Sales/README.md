# Sales slice

Completed sales, receipts, returns, and warranty lookup.

## Owns
- Sales list (`GET /sales`) with channel / status / date-range / search filters.
- Sale detail sheet → printable receipt (`GET /sales/:id/receipt`) and the
  return flow (`POST /sales/:id/return`, gated on `sale.return`).
- Warranty lookup by IMEI: online `GET /sales/warranty/:imei`, else rebuilt
  offline from the cached `DeviceEntity` + its latest sale.

## Public API
- `SalesModule.feature` — the one registry line. Permission: `sale.read`.

## Must never
- Write offline: sales reads and returns are online-only (returns block with a
  needs-connection message when offline).
- Show cost/profit the server omitted (fields are optional; render only if present).
- Import another feature slice (`SalesReceiptPrinting` is duplicated from Pos).

## Notes
- No warranty expired/active column exists offline beyond the latest-sale window;
  `alreadyReturned` is inferred from device status when offline (approximation).

## Note
- Named `Sales.README.md` (not `README.md`): the file-system synchronized
  group copies loose `.md` as bundle resources and flattens them by basename,
  so three `README.md` files would collide. Renamed to keep the gate green
  without editing `project.pbxproj`.
