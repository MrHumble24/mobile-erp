# page: shipments

The `/shipments` screen: manage incoming device batches and their suppliers.
Composes entities and features; holds no HTTP of its own.

## Tabs
- **Shipments** — filters (debounced search over supplier/notes, supplier select,
  open-only switch), table with a received/expected progress badge, detail drawer,
  intake dialog and edit dialog. Newest first.
- **Suppliers** — `features/manage-supplier` `SupplierPanel`; per-supplier shipment
  count is derived from the loaded shipments list (no server count endpoint).

## Local state (model/)
- `use-shipment-browser.ts` — filter state + client-side filter/sort of the loaded
  (non-paginated) shipments list.
- `use-shipment-selection.ts` — detail drawer / edit / intake dialog targets.
- `use-shipment-devices.ts` — one shipment + a page of its devices (`useDevices`
  with `shipmentId`) + a model-id → name map for the drawer.

## Drawer
Summary (supplier, dates, expected vs received, phone-expense total + customs-fee
total + avg landed/unit when cost-gated, a "phones without a customs fee" warning
when any, notes, created at) then the batch devices with pagination. A device row
deep-links to `/inventory?imei=<imei>`. A shipment has no expense of its own
(ADR 0026).

## Cost gating
Phone-expense / customs-fee totals and acquisition/landed columns render only for
`device.cost.view`. Intake needs `device.create`; shipment/supplier writes need
`shipment.manage`.

## Must never
- Call `fetch`/repositories directly, hold server data in local state, or render
  native form/table controls (use `shared/ui`).

## Open questions
- Avg landed cost in the drawer is over the loaded devices page only (exact when
  the batch fits one page). The shipments list endpoint is not paginated.
- The drawer summary shows the shipment's `paymentAccountCode` read-only; it is
  fixed at creation (set in the create form, `features/intake-shipment`).

## Quantity lines (ADR 0034)
`ShipmentStockSection` reads the shipment's `stockLines` from `GET /shipments/:id`
(built server-side from its PURCHASE movements), so they survive a reload; the old
session-only list is gone. Adding stock invalidates the shipment detail query.
