# feature: intake-shipment

Create a shipment, then scan devices into it in a running batch.

## Owns
- `IntakeShipmentDialog` — create form (no id) → device intake loop (with id).
- `ShipmentCreateForm` — supplier select + "+ new supplier" (opens
  `SupplierCreateDialog`), date, expected count, notes. A shipment has no
  expense of its own (ADR 0026); each phone carries its own.
- `SupplierCreateDialog` — composes `entities/supplier` `SupplierFormFields`
  (FSD forbids importing `manage-supplier`; the fields/schema are shared via the
  entity).
- `DeviceIntakeForm` — model `Combobox` (QUANTITY models excluded, ADR 0029) +
  `DynamicSpecFields` + cost/target-price + optional per-phone expense (shown with
  `device.expense`, ADR 0026), then the identifier block for the model's kind: a
  SERIAL model shows one serial input (no IMEI / dual-SIM); an IMEI model shows the
  IMEI block (IMEI 1 + inline Dual-SIM `Switch`, IMEI 2 when on). Selecting a model
  sets `kindCode` and clears the identifier fields.
- `IntakeIdentifierFields` — `ImeiBlock` and `SerialBlock` (extracted so the form
  stays small). A scan FILLS a slot checking format only (inline error).
- `IntakeConfirmDialog` — shadcn `Dialog` showing model, the unit code (mono),
  optional IMEI 2, and cost with Add / Cancel; a duplicate shows the error with
  only Cancel. Scans are ignored while open.
- `use-scan-intake.ts` — the scan-and-stage flow, kind-aware: a serial scan checks
  `isSerial`, an IMEI scan checks 15-digit length; `stage()` opens the confirm
  dialog once the identifier + model + cost are set (full validation in `addItem`).
- `IntakeLookupPanel` + `use-intake-lookup.ts` — code lookup (ADR 0031): an
  optional "code on the box" input (kept separate so the IMEI field stays an
  IMEI) plus a full IMEI feed `entities/lookup`. A named product auto-selects and
  fills only the empty storage/colour; an unnamed reference offers a one-time
  pick with "remember" (`POST /lookup/links`, only with `device.update`); an
  unknown code shows a quiet hint. The lookup never gates saving. The Apple-code
  credit (`catalog.dataCredit`) sits under the panel.
- `DeviceBatchList` — batch table (unit code column), running "n registered /
  expected m", per-device customs fee + landed cost after submit (cost-gated).
  Server 400 `problems` (keyed by code) annotate the offending rows.
- `use-intake-batch.ts` — batch state and per-kind validation: SERIAL →
  `isSerial` + serial dedupe, builds `{ serialNumber }`; IMEI → 15-digit + imei2
  rules, builds `{ imei, imei2 }`. `addItem` returns the i18n error key (or null).

## Public API
- `IntakeShipmentDialog` ({ open, onOpenChange, existingShipmentId }).

## Uses
- `entities/shipment`: `useCreateShipment`, `useAddShipmentDevices`, `useShipment`.
- `entities/supplier`: `useCreateSupplier`, `SupplierFormFields`, schema + mappers.
- `entities/device-model`: `useDeviceModels`, `useDeviceModelAttributes`,
  `DynamicSpecFields`. `entities/lookup`: `useLookup`, `useTeachLink`.
  `shared/ui`: `Combobox`, `Checkbox`.

## Must never
- Call HTTP directly or import another feature.

## Gating
- Customs fee and landed cost render only for `device.cost.view`; the per-phone
  expense fields need `device.expense`. Caller gates the dialog behind
  `device.create` / `shipment.manage`.

## Payment
- The create form has a "Paid from" `AccountSelect` (default Cash) from
  `entities/ledger`, sent as `paymentAccountCode`. It is fixed after creation.
