# features/import-shipment

Imports supplier batch sheets (`Приход документ.xlsx`) from Excel in the browser (ADR 0065).

## Owns

- Parsing supplier batch sheets in the browser via `read-excel-file` (`model/parse-batch-file.ts`).
- Previewing extracted rows with won cost, dollar conversion at exchange rate, expense, markup, battery, and defects (`ui/ImportShipmentPreviewTable.tsx`).
- Submitting `POST /shipments/import` via `api/import-shipment.repository.ts` and React Query hook `model/use-import-shipment.ts`.
- Highlighting row validation problems and expense warnings returned from server.
- Opening the created shipment in the intake dialog on success.

## Exposes

- `ImportShipmentDialog` — `{ open, onOpenChange, onSuccess }`.
- `parseBatchRows`, `parseBatchFile`.
- Types: `ImportShipmentDto`, `ImportShipmentRow`, `ImportShipmentProblem`, `ImportShipmentWarning`.

## Must never

- Perform server-side Excel parsing (parsing is strictly client-side).
- Bypass role permission gating (`shipment.manage` + `device.create`).
