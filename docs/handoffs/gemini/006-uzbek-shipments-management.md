# 006 — Uzbek copy for the completed shipments and suppliers screen

Status: open · Owner: Gemini (Antigravity) · Depends on: `main` ≥ merge "complete shipment and supplier management screen"

## Why
`/shipments` now has a Shipments tab (filters, progress, detail drawer with the batch's devices, edit
dialog) and a Suppliers tab (create/edit). The Claude frontend agent added 29 keys to
`client/src/shared/i18n/shipments` with English placeholders in the `uz` bundle, because Claude agents
never hand-write Uzbek. Same shape as handoff 005.

=== MESSAGE ===
Read `client/src/shared/i18n/GLOSSARY.md`. You are a native Uzbek (Latin script) UX writer for a phone retail POS in Malika Bazaar. Start a fresh branch from `main` (`git checkout -b gemini/uz-shipments main`), or continue on your `gemini/uz-inventory` branch after merging `main` into it.

Translate these keys in `client/src/shared/i18n/uz/shipments.json` (English placeholders copied from `en/shipments.json`); keep keys and `{placeholders}` unchanged and the key set identical between `en` and `uz`:

`totalCount` (`{count} shipments`), `createShipment`, `createShipmentHint`, `editSupplier`, `selectSupplier`, `allSuppliers`, `supplierActive`, `supplierShipments`, `supplierDuplicate`, `overheadPerUnit`, `overheadRespreadHint` (warns that changing overhead re-spreads landed cost across every unit of the batch), `avgLandedPerUnit`, `createdAt`, `editShipment`, `openDetail`, `continueIntake`, `detailTitle`, `statusComplete`, `statusOpen`, `openOnly`, `searchPlaceholder`, `empty`, `emptyHint`, `noDevices`, `pageRange` (`{from}–{to} of {total}`), `perPage`, `imeiLength`, `registeredProgress` (`{received} registered / {expected} expected`), `landedCostResults`.

Glossary: Shipment → Partiya, Supplier → Yetkazib beruvchi, Overhead → Qo'shimcha xarajat (or your better term; add it to the glossary), Landed cost → Tannarx, Intake → Qabul.

Then review `/shipments` with the `qc@malika.uz` and `owner@malika.uz` dev logins (credentials in `server/.env`): both tabs, the detail drawer, the edit dialog, the supplier dialogs and the intake loop. Fix wording that reads as literal translation.

`pnpm lint` and `pnpm build` green in `client/`. Commit as `feat(client): uzbek copy for shipments management` adding only the i18n files and the glossary. Fill the Result section of `docs/handoffs/gemini/006-uzbek-shipments-management.md`, set Status to done.
=== END ===

## Result (Gemini fills)
- Commit:
- Glossary terms added:
- Wording changes proposed for `en`:
- Notes for other agents:
