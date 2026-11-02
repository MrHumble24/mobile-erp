# 011 — Uzbek copy for the completed sales management screen

Status: done · Owner: Gemini (Antigravity) · Depends on: `main` ≥ merge "full sales management screen"

## Why

`/sales` now has two tabs (sales list, warranty lookup), a filter row (period presets, search by IMEI /
customer / phone, channel, status, warranty, cashier), summary tiles, a table with a warranty column and
icon row actions, a sale detail sheet (device specs, customer, money, warranty, notes, return block) and
an improved return dialog. 35 keys hold English placeholders in `client/src/shared/i18n/uz/sales.json`
because Claude agents never hand-write Uzbek.

=== MESSAGE ===
Read `client/src/shared/i18n/GLOSSARY.md`. You are a native Uzbek (Latin script) UX writer for a phone retail POS in Malika Bazaar. Work on a branch from `main`.

Translate every key in `client/src/shared/i18n/uz/sales.json` that still equals its `en/sales.json` value (35 keys). Groups, with context:

- Page and tabs: `description` (subtitle under the title), `tabSales`, `tabWarranty`.
- Filters: `filterSearch` (placeholder: search IMEI, customer or phone), `filterStatus`, `statusActive` (not returned), `statusReturned`, `filterWarranty`, `resetFilters`, `exportCsv`. Check `filterChannel`: the English label is now just "Channel".
- Table: `warranty` (column header), `daysShort` (`{count}d` badge, keep it 1–2 characters after the number), `returned` (badge), `actionDetail` (icon tooltip: open details).
- Summary tiles: `statsCount`, `statsRevenue`, `statsAvgPrice`, `statsReturns`, `statsRefundTotal` (small text under returns: refunded amount), `statsNetProfit`.
- Detail sheet: `detailTitle`, `deviceSection`, `customerSection`, `moneySection`, `returnSection`, `returnedAt`, `processedBy`, `viewCustomer`, `viewConsignment` (opens the Nasiya record for a B2B sale), `openDevice`, `openSale` (button in the warranty lookup result).
- Return dialog and lookup: `imeiPlaceholder`, `refundExceedsWarning` (warning, not an error: refund is higher than the sale price), `returnReasonPlaceholder`, `returnConflict` (toast: the sale changed on another terminal, reload and retry).
  Keep keys and `{placeholders}` unchanged; key sets identical between `en` and `uz`. Glossary: Return → Qaytarish, Refund → Qaytarilgan pul, Warranty → Kafolat (already there), Net profit → Sof foyda (already there), Average price → O'rtacha narx. Add what you coin.

Then review in context with the `cashier@malika.uz` and `owner@malika.uz` logins (credentials in `server/.env`): both tabs, every filter, open a sale's detail sheet, process a return from the sheet, look up the returned IMEI in the warranty tab, export the CSV. Fix wording that reads as literal translation; tile labels and the warranty badge must stay short.

`pnpm lint` and `pnpm build` green in `client/`. Commit as `feat(client): uzbek copy for sales management` adding only the i18n files and the glossary. Fill the Result section of `docs/handoffs/gemini/011-uzbek-sales-management.md`, set Status to done.
=== END ===

## Result (Gemini fills)

- Commit: `770be05` (`feat(client): uzbek copy for sales management`)
- Glossary terms added: Refund (Qaytarilgan pul / Qaytarilgan summa), Average Price (O'rtacha narx)
- Wording changes proposed for `en`: None; key sets remain identical (67 keys). `filterChannel` in `uz` standardized to "Kanal" to match `en` "Channel".
- Notes for other agents: All 35 placeholder keys translated into native Uzbek (Malika Bazaar POS context); summary tiles and warranty badges remain short (1-char suffix `{count}k`).
