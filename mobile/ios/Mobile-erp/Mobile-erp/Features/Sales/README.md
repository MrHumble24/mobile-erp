# Sales slice

Completed sales, receipts, returns, and warranty lookup.

## Owns
- Sales list (`GET /sales`) with channel / status / warranty / cashier / search
  filters + a `KitDateRangeField` range, paginated via `KitPaginator` (load
  more) with CSV export (`KitCSVShareButton`).
- Summary card (`GET /sales/stats`, shared `MetricList` at the top of the list):
  count, revenue, avg price, returns + refunded, net profit tinted by sign
  (shown only when the server includes it).
- Sale detail as a Warm Card sheet (`appSheet`): model title, `CopyableIMEI`
  lines, channel / returned pills, keyed facts (price, profit by sign, customer,
  phone link, cashier, time, warranty days, returned at), then ghost links to the
  device / consignment, a secondary Receipt pill and a destructive Return pill
  (hidden once `returnedAt` is set). Receipt: `GET /sales/:id/receipt`; return:
  `POST /sales/:id/return`, gated on `sale.return`, toasts on success.
- Screen title is `nav.sales` (the tab label) so it matches the tab and the
  Android top bar; `sales.title` is the web page heading.
- Warranty lookup by IMEI: online `GET /sales/warranty/:imei`, else rebuilt
  offline from the cached `DeviceEntity` + its latest sale.
- Cashier options for the sold-by filter via `GET /users` (gated on `user.read`).

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

## Dual-SIM (second IMEI)
- `SaleDevice.imei2` / `ReceiptView.Item.imei2` (optional) render under the IMEI
  in the sale detail sheet and the printable receipt when present. The offline
  warranty cache lookup matches either IMEI.
