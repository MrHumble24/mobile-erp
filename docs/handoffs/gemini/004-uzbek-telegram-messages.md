# 004 — Uzbek copy for the Telegram owner alerts

Status: open · Owner: Gemini (Antigravity) · Depends on: server wave 3 on `main` (commit `36d2a4c`)

## Why
Wave 3 added Telegram alerts for the store owner (PRD Module 6): shipment arrival, low-margin sale,
consignment out, partner payment, low stock, overdue consignments and the daily closing digest. Every
string lives in one file, `server/src/telegram/messages.ts`, in English as a placeholder. Claude agents
never hand-write Uzbek, so the owner-facing text is Gemini's. This is the only server file Gemini edits.

=== MESSAGE ===
Read `client/src/shared/i18n/GLOSSARY.md` (if present) and `server/src/telegram/README.md`. You are a native Uzbek (Latin script) writer for a phone retail shop in Malika Bazaar, Tashkent. The reader is the store owner on their phone, so keep every message short, scannable and in shop language.

Setup: your checkout is on `gemini/ui-waves-1-2`; the Telegram code is only on `main`. Commit or stash your client work, then `git merge main` into your branch (server-only vs client-only changes, no conflicts expected). Work on that branch.

Task: in `server/src/telegram/messages.ts` replace the English bodies of these seven functions with Uzbek. Keep the function names, parameter shapes and the `money()` / `date()` / `short()` helpers; do not move strings out of this file and do not touch any other server file.

1. `shipmentRegistered({ supplier, count, models })` — new shipment received, count of devices, model list.
2. `belowMarginSale({ imei, model, salePrice, targetPrice, marginPercent })` — a device sold below its target price or below the minimum margin; `targetPrice` may be null (say "maqsad narxi yo'q" or your better phrasing).
3. `consignmentCreated({ partner, imei, agreedPrice, dueDate })` — device handed to a partner shop on nasiya with an agreed price and due date.
4. `paymentReceived({ partner, amount })` — a partner paid.
5. `lowStock(rows: { modelId, storage, currentCount, threshold }[])` — one line per rule: storage variant, short model id, current count over threshold.
6. `overdueConsignments(rows: { partner, imei, agreedPrice, dueDate }[])` — one line per overdue nasiya.
7. `dailyDigest({ date, unitsSold, revenue, netProfit, expenses, outstanding })` — end-of-day summary: units sold, revenue, net profit, expenses, total outstanding nasiya balance.

Rules:
- Glossary terms: Consignment → Nasiya, Partner → Hamkor, Warranty → Kafolat, In stock → Omborda, Sold → Sotildi, Shipment → Partiya, IMEI → IMEI. Add new terms you coin to the glossary file.
- Formatting helpers: change `money()` to `n.toLocaleString('uz-UZ')` + ` so'm` and `date()` to `DD.MM.YYYY`. Keep the `\n` line structure so messages render as short lines in Telegram. Plain text only, no Markdown or HTML (the service sends plain text).
- A short emoji prefix per message type is fine if it helps scanning (one per message, at the start).
- Keep `server/src/telegram/messages.ts` under 150 lines and `pnpm lint`, `pnpm build`, `pnpm test` green in `server/`. If a spec asserts an English phrase, update that assertion to the Uzbek text (the message functions are the source of truth).
- Commit on your branch with message `feat(server): uzbek telegram messages` adding only `server/src/telegram/messages.ts`, the glossary and any spec you had to touch. Fill the Result section of `docs/handoffs/gemini/004-uzbek-telegram-messages.md` and set Status to done.
=== END ===

## Result (Gemini fills)
- Commit:
- Glossary terms added:
- Specs touched:
- Notes for other agents (wording the server should expose differently, missing data in a message, etc.):
