# feature: intake-shipment

Create a shipment, then scan devices into it in a running batch.

## Owns
- `IntakeShipmentDialog` — create form (no id) → device intake loop (with id).
- `ShipmentCreateForm` — supplier select + "+ new supplier" (opens
  `SupplierCreateDialog`), date, expected count, overhead (cost-gated), notes.
- `SupplierCreateDialog` — composes `entities/supplier` `SupplierFormFields`
  (FSD forbids importing `manage-supplier`; the fields/schema are shared via the
  entity).
- `DeviceIntakeForm` — scan + searchable model `Combobox` + `DynamicSpecFields`
  (the chosen model's attribute schema) + cost/target-price. Adding a unit keeps
  the model and its spec values for the next scan; only IMEI and cost reset.
- `DeviceBatchList` — batch table, running "n registered / expected m" total,
  per-device landed cost after submit (cost-gated), submit button. Server 400
  `problems` (keyed by IMEI) highlight and annotate the offending rows.
- `use-intake-batch.ts` — batch state, 15-digit + duplicate validation, the
  add-devices mutation; maps `problems` to `problemsByImei`.

## Public API
- `IntakeShipmentDialog` ({ open, onOpenChange, existingShipmentId }).

## Uses
- `entities/shipment`: `useCreateShipment`, `useAddShipmentDevices`, `useShipment`.
- `entities/supplier`: `useCreateSupplier`, `SupplierFormFields`, schema + mappers.
- `entities/device-model`: `useDeviceModels`, `useDeviceModelAttributes`,
  `DynamicSpecFields`. `shared/ui`: `Combobox`.

## Must never
- Call HTTP directly or import another feature.

## Gating
- Overhead and landed cost render only for `device.cost.view`. Caller gates the
  dialog behind `device.create` / `shipment.manage`.
