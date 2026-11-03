# feature: intake-shipment

Create a shipment, then scan devices into it in a running batch.

## Owns
- `IntakeShipmentDialog` — create form (no id) → device intake loop (with id).
- `ShipmentCreateForm` — supplier select + "+ new supplier" (opens
  `SupplierCreateDialog`), date, expected count, overhead (cost-gated), notes.
- `SupplierCreateDialog` — composes `entities/supplier` `SupplierFormFields`
  (FSD forbids importing `manage-supplier`; the fields/schema are shared via the
  entity).
- `DeviceIntakeForm` — model `Combobox` + `DynamicSpecFields` (the chosen
  model's attribute schema) + cost/target-price, then one IMEI block: IMEI 1
  with the "Dual SIM" `Switch` inline on its label row, and IMEI 2 under it only
  when dual-SIM is on. A scan FILLS the next empty slot checking length only
  (inline error under that field) — scanning IMEI 1 never raises "IMEI 2
  required". When every required slot + model + cost are set the confirm dialog
  opens automatically; a missing model/cost focuses that field instead of
  erroring. Confirming keeps the model, specs, cost and dual-SIM toggle and
  clears the IMEI slots for the next unit. Dual-SIM is derived from `imei2 != null`.
- `IntakeConfirmDialog` — shadcn `Dialog` showing model, both IMEIs (mono) and
  cost with Add / Cancel; on a duplicate IMEI it shows the error with only
  Cancel. Scans are ignored while it is open.
- `use-scan-intake.ts` — owns the scan-and-stage flow: routes a code to a slot,
  checks 15-digit length (inline `slotErrors`), and `stage()` opens the confirm
  dialog once slots + model + cost are set (full validation stays in `addItem`).
- `DeviceBatchList` — batch table, running "n registered / expected m" total,
  per-device landed cost after submit (cost-gated), submit button. Server 400
  `problems` (keyed by IMEI) highlight and annotate the offending rows.
- `use-intake-batch.ts` — batch state, 15-digit + duplicate validation (plus
  `imei2`: required when `dualSim` is on, 15 digits and distinct from `imei`;
  sent as `null` when off), the add-devices mutation; maps `problems` to
  `problemsByImei`. `addItem` returns the i18n error key (or null) so the confirm
  dialog can surface a duplicate; the top banner is for server/submit errors only.

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
