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
Summary (supplier, dates, expected vs received, overhead + overhead-per-unit +
avg landed/unit when cost-gated, notes, created at) then the batch devices with
pagination. A device row deep-links to `/inventory?imei=<imei>`.

## Cost gating
Overhead and acquisition/landed columns render only for `device.cost.view`.
Intake needs `device.create`; shipment/supplier writes need `shipment.manage`.

## Must never
- Call `fetch`/repositories directly, hold server data in local state, or render
  native form/table controls (use `shared/ui`).

## Open questions
- Avg landed cost in the drawer is over the loaded devices page only (exact when
  the batch fits one page). The shipments list endpoint is not paginated.
