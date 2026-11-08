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
- `ui/ConsignDeviceRow.tsx` — one scannable device row with a debounced
  inventory lookup (`use-consign-lookup.ts`, GET `/devices/by-imei`, the same
  store scoping the write uses): resolves the model card + status badge,
  warns when the unit is not IN_STOCK or missing, and prefills the agreed
  price with the unit's PARTNER list price.

## Offline

On a transport failure, `use-consign-form` enqueues each transfer via
`entities/sync` (no `baseVersion`; the server resolves by device) and reports a
`queued` count for the "queued" toast.

## Never

Call `useQuery`/`useMutation` directly (uses `entities/consignment` hooks).
Render native form controls. Author Uzbek copy.
