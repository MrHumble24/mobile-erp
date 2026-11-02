# feature: edit-shipment

Edits a shipment's mutable fields: date, expected count, overhead cost, notes.

## Owns
- `EditShipmentDialog` — shadcn `Dialog` + `Form` (react-hook-form + zod).
- `EditShipmentFields` — the field group.
- `edit-shipment.schema.ts` — zod schema + `toUpdateShipmentDto`.

## Public API
- `EditShipmentDialog` ({ shipment, canViewCost, open, onOpenChange }).

## Cost gating
- The overhead field renders and is sent only when `canViewCost`
  (`device.cost.view`). When the editor cannot view costs, `overheadCost` is
  omitted from the PATCH payload so the server does not touch it.
- Changing overhead re-spreads landed cost across every device in the batch;
  the field carries a hint saying so.

## Uses
- `entities/shipment`: `useUpdateShipment` (invalidates lists + detail).

## Must never
- Call HTTP directly or import another feature.

## Gating
- Caller renders this only for `shipment.manage` holders.
