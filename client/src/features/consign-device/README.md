# features/consign-device

One action: hand one or more in-stock devices to a partner on consignment.

## Public API

- `ConsignDeviceDialog` — props `{ open, onOpenChange, onSuccess?,
  initialImei?, initialAgreedPrice?, initialPartnerId?, lockPartner? }`.
  POS passes a prefilled single device; the partners drawer passes
  `initialPartnerId` + `lockPartner` to lock the partner.

## Internals

- `model/use-consign-form.ts` — row state (one `{imei, agreedPrice}` per
  device) + shared partner/dueDate/notes. `submit()` calls the idempotent
  create endpoint once per row, sequentially, each with its own
  `clientMutationId`, so a retry never double-writes a partial batch.
- `ui/ConsignDeviceForm.tsx` — partner select + device rows + shared fields.
- `ui/ConsignDeviceRow.tsx` — one scannable device row.

## Never

Call `useQuery`/`useMutation` directly (uses `entities/consignment` hooks).
Render native form controls. Author Uzbek copy.
