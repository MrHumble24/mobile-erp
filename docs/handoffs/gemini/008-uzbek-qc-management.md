# 008 — Uzbek copy for the completed QC management screen

Status: open · Owner: Gemini (Antigravity) · Depends on: `main` ≥ merge "full QC management"

## Why
`/qc` now has four tabs (queue, inspections, stats, lookups), a rebuilt inspection dialog with grades from
the lookup table and per-defect notes, an inspections history with a detail sheet, stats cards, and
runtime management of defect types and grades. 42 new keys hold English placeholders in
`client/src/shared/i18n/uz/qc.json` because Claude agents never hand-write Uzbek.

=== MESSAGE ===
Read `client/src/shared/i18n/GLOSSARY.md`. You are a native Uzbek (Latin script) UX writer for a phone retail POS in Malika Bazaar. Work on a branch from `main`.

Translate these keys in `client/src/shared/i18n/uz/qc.json` (English placeholders copied from `en/qc.json`); keep keys and `{placeholders}` unchanged and the key sets identical between `en` and `uz`:

`inspectNext`, `battery`, `repairCost`, `defectType`, `defectCount`, `inspectionSavedStatus` (toast: inspection saved, device is now {status}), `noPrevious`, `previous`, `notInspectable` (only in-stock or defective devices can be inspected), `failNeedsDefect` (a failed inspection needs at least one defect), `never`, `lastInspection`, `queueEmpty`, `allStatuses`, `showInspected`, `inspector`, `allInspectors`, `inspectionDetails`, `openInInventory`, `scanPlaceholder`, `tabQueue`, `tabInspections`, `tabStats`, `tabLookups`, `statInspected`, `statPassRate`, `statFailed`, `statAvgBattery`, `byGrade`, `topDefects`, `preset_today`, `preset_7d`, `preset_30d`, `preset_custom`, `defectTypes`, `grades`, `lookupCode`, `lookupLabel`, `sortOrder`, `active`, `codeFormat` (code must be UPPER_SNAKE letters, digits, underscores), `codeDuplicate`.

Glossary: Inspection → Tekshiruv, Defect → Nuqson, Grade → Daraja (cosmetic grade), Battery health → Batareya holati, Pass → O'tdi, Fail → O'tmadi, Queue → Navbat. Add what you coin to the glossary.

Then review in context with the `qc@malika.uz` and `owner@malika.uz` logins (credentials in `server/.env`): scan a device from the queue, run a failing inspection with a defect note, open the Inspections tab and its detail sheet, the Stats tab, and (as owner) the Lookups tab, adding one defect type. Fix wording that reads as literal translation.

`pnpm lint` and `pnpm build` green in `client/`. Commit as `feat(client): uzbek copy for qc management` adding only the i18n files and the glossary. Fill the Result section of `docs/handoffs/gemini/008-uzbek-qc-management.md`, set Status to done.
=== END ===

## Result (Gemini fills)
- Commit:
- Glossary terms added:
- Wording changes proposed for `en`:
- Notes for other agents:
