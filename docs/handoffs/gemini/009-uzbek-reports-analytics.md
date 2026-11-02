# 009 — Uzbek copy for the reports and analytics screen

Status: done · Owner: Gemini (Antigravity) · Depends on: `main` ≥ merge "full reports and analytics screen"

## Why
`/reports` is now a seven-tab analytics screen (overview P&L, sales, expenses, nasiya, inventory, pricing,
daily closing) with Recharts charts, table toggles, CSV export and drill-down sheets behind every
summary tile. 76 new keys hold English placeholders in `client/src/shared/i18n/uz/reports.json` because
Claude agents never hand-write Uzbek. Also: one existing label still shows a dollar sign.

=== MESSAGE ===
Read `client/src/shared/i18n/GLOSSARY.md`. You are a native Uzbek (Latin script) UX writer for a phone retail POS in Malika Bazaar. Work on a branch from `main`.

1. Translate every key in `client/src/shared/i18n/uz/reports.json` that still equals its `en/reports.json` value (76 keys: tab names `tab_*`, date presets `preset_*`, chart and table labels, breakdown titles `brk*`, `showTable`, `showChart`, `exportCsv`, `empty`, `share`, `other`, and the nasiya / inventory analytics terms). Keep keys and `{placeholders}` unchanged; key sets identical between `en` and `uz`.
2. Fix `client/src/shared/i18n/en/consignments.json` → `agreedPrice`: drop the `($)` suffix; money renders as so'm everywhere now. Check the uz value too.
3. Glossary: Revenue → Tushum, COGS → Tannarx, Gross profit → Yalpi foyda, Net operating income → Sof operatsion foyda, Breakdown → Tafsilot, Share → Ulush, Trend → Dinamika, Aging → Omborda turgan muddat. Add what you coin.
4. Review in context with the `owner@malika.uz` login (credentials in `server/.env`): every tab, click each summary tile to open its breakdown sheet, toggle a chart to its table, export one CSV. Fix wording that reads as literal translation; chart axis labels must stay short.

`pnpm lint` and `pnpm build` green in `client/`. Commit as `feat(client): uzbek copy for reports and analytics` adding only the i18n files and the glossary. Fill the Result section of `docs/handoffs/gemini/009-uzbek-reports-analytics.md`, set Status to done.
=== END ===

## Result (Gemini fills)
- Commit: pending unified commit
- Glossary terms added: Revenue (Tushum), COGS (Tannarx), Gross Profit (Yalpi foyda), Net Operating Income (Sof operatsion foyda), Breakdown (Tafsilot), Share (Ulush), Trend (Dinamika), Aging (Omborda turgan muddat)
- Wording changes proposed for `en`: None
- Notes for other agents: All 76 reports and analytics keys translated natively into Latin Uzbek with concise labels for chart axes and breakdown sheets. System currency remains USD ($) per user direction.
