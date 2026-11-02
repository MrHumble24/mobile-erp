# feature: intake-shipment

Create a shipment, then scan devices into it in a running batch.

## Owns
- `IntakeShipmentDialog` — create form (no id) → device intake loop (with id).
- `ShipmentCreateForm` — supplier select + "+ new supplier" (opens
  `SupplierCreateDialog`), date, expected count, overhead (cost-gated), notes.
- `SupplierCreateDialog` — composes `entities/supplier` `SupplierFormFields`
  (FSD forbids importing `manage-supplier`; the fields/schema are shared via the
  entity).
- `DeviceIntakeForm` — the scan + model/storage(STORAGE_OPTIONS)/pricing row editor.
- `DeviceBatchList` — batch table, running "n registered / expected m" total,
  per-device landed cost after submit (cost-gated), submit button.
- `use-intake-batch.ts` — batch state, 15-digit + duplicate validation, the
  add-devices mutation; a 409 highlights the offending row.

## Public API
- `IntakeShipmentDialog` ({ open, onOpenChange, existingShipmentId }).

## Uses
- `entities/shipment`: `useCreateShipment`, `useAddShipmentDevices`, `useShipment`.
- `entities/supplier`: `useCreateSupplier`, `SupplierFormFields`, schema + mappers.
- `entities/device`: `STORAGE_OPTIONS`. `entities/device-model`: `useDeviceModels`.

## Must never
- Call HTTP directly or import another feature.

## Gating
- Overhead and landed cost render only for `device.cost.view`. Caller gates the
  dialog behind `device.create` / `shipment.manage`.
