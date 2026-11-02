# features/sales — Sales & warranty (wave 4)

Sales history, printable receipt, warranty lookup, and returns. All **online**
(sales are not in the `/sync/changes` feed).

## Owns
- `/sales` route (perm `sale.read`): list + channel/date filters, a sale detail
  sheet, the 58mm receipt view, a warranty-lookup panel, and the return dialog.

## Public API (via the module)
- `salesRoutes`, `salesNavItems` — wired in `app/router/feature_registry.dart`.

## Notes
- **Channel is derived** from `consignmentId` (consignment ⇒ B2B), never stored.
- Redacted cost fields (`landedCostSnapshot`, `netProfit`) are **nullable** on
  `SaleView` and shown only when present.
- **Returns are online-only** (perm `sale.return`) — not one of the 4 offline
  mutation types; the dialog blocks when offline. `expectedVersion` is omitted
  so the server uses the device's current version.
- Receipt Print is a **wave-8 stub** (copy-to-clipboard works); no printing dep.

## Must never
- Write outside this slice, or add server state to Zustand-style client state.
