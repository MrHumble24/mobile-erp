# feature: manage-supplier

CRUD for suppliers (name, country, contact, notes, active flag).

## Owns
- `SupplierPanel` — table of suppliers + "new" button + edit action. Optional
  `shipmentCounts` map renders a per-supplier shipment count column (derived by
  the caller from the already-loaded shipments list; no server count endpoint).
- `SupplierDialog` — shadcn `Form` create/edit. Create sends only
  name/country/contact/notes (server whitelist); edit adds the `isActive` Switch.
  A 409/400 surfaces as a duplicate-name field error.

## Public API
- `SupplierPanel` ({ canManage, shipmentCounts? }).
- `SupplierDialog` ({ supplier, open, onOpenChange }) — reused by `intake-shipment`.

## Uses
- `entities/supplier`: `useSuppliers`, `useCreateSupplier`, `useUpdateSupplier`,
  `SupplierFormFields`, `supplierFormSchema`, DTO mappers.

## Must never
- Call HTTP directly or import another feature. The shared field group and schema
  live in `entities/supplier`, not here.

## Gating
- `canManage` (= `shipment.manage`) hides create/edit; viewing needs `shipment.read`.
