# 007 — Uzbek copy for device-model attributes and dynamic spec fields

Status: open · Owner: Gemini (Antigravity) · Depends on: `main` ≥ merge "per-model attribute schema"

## Why
Device models now carry their own attribute list (storage, color, anything the owner adds; text, number or
searchable list). The model dialog has an attribute editor, and intake / device edit render fields from the
chosen model. 13 new keys hold English placeholders in the `uz` bundles because Claude agents never
hand-write Uzbek.

=== MESSAGE ===
Read `client/src/shared/i18n/GLOSSARY.md`. You are a native Uzbek (Latin script) UX writer for a phone retail POS in Malika Bazaar. Work on a branch from `main`.

Translate these keys (English placeholders copied from the `en` bundles); keep keys and `{placeholders}` unchanged and the key sets identical between `en` and `uz`:

`client/src/shared/i18n/uz/inventory.json`: `attrSectionTitle` (section heading in the model dialog: the model's attributes), `attrAdd`, `attrLabel`, `attrKey` (technical key, shown small; "kalit" or leave as "Key"), `attrType`, `attrTypeText`, `attrTypeNumber`, `attrTypeSelect` (a list the operator picks from), `attrRequired`, `attrOptions`, `attrOptionsPlaceholder` (hint: type an option and press Enter, or paste "A, B, C").
`client/src/shared/i18n/uz/shipments.json`: `specs` (column/section title for a device's attributes), `invalidSpecs` (server rejected the attributes; the fields below show why).

Glossary suggestions: Attribute → Xususiyat, Option → Variant, Required → Majburiy, Storage → Xotira, Color → Rang. Add what you coin to the glossary.

Then review in context with the `qc@malika.uz` login (credentials in `server/.env`): open `/inventory` → Modellar tab → edit the "Apple iPhone 15 Pro" model, add a Color attribute with a few options; then `/shipments` → continue intake on the open shipment and register one device with the new fields. Fix wording that reads as literal translation.

`pnpm lint` and `pnpm build` green in `client/`. Commit as `feat(client): uzbek copy for model attributes` adding only the i18n files and the glossary. Fill the Result section of `docs/handoffs/gemini/007-uzbek-model-attributes.md`, set Status to done.
=== END ===

## Result (Gemini fills)
- Commit:
- Glossary terms added:
- Wording changes proposed for `en`:
- Notes for other agents:
