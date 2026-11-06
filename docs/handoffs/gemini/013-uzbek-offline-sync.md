# 013 — Uzbek copy for the offline sync layer

Status: replaced by 031 (one Uzbek pass) on 2026-11-06 · Owner: Gemini (Antigravity)

## Why
The web client now works through bazaar internet outages (ADR 0018): POS checkouts, consignment
transfers, settlements and returns are queued in the browser and pushed to the server when the
connection returns; a header pill shows online/offline and the pending count; `/sync` (admins) lists
this terminal's queue and the server's IMEI conflicts. 36 new keys hold English placeholders because
Claude agents never hand-write Uzbek. Several strings are toasts cashiers read in a hurry.

=== MESSAGE ===
Read `client/src/shared/i18n/GLOSSARY.md`. You are a native Uzbek (Latin script) UX writer for a phone retail POS in Malika Bazaar. Work on a branch from `main`.

Translate every key whose `uz` value still equals its `en` value in `client/src/shared/i18n/uz/sync.json` (35 keys) and `nav.sync` in `uz/nav.json` (1 key). Context:
- Header pill: `online`, `offline`, `pending` (`{count} pending`), `rejectedCount` (`{count} rejected`), `lastSync` (`Last sync: {time}`), `neverSynced`, `openSync` (aria-label of the pill).
- Toasts after an offline action: `queuedSale` (`{count}` sales queued, will sync when online), `queuedConsign` (`{count}` transfers to a partner), `queuedSettle`, `queuedReturn`, `retryTriggered`, `discarded`, `resolved`, `resolveFailed` (`{reason}`: the device changed again on the server, the terminal's change could not be applied).
- `/sync` page: `title`, `subtitle`, tabs `tabQueue` / `tabConflicts`, columns `colType`, `colImei`, `colTime`, `colStatus`, `colError`, `colActions`, `colTerminal`, `colBaseVersion`, badges `statusPending` / `statusRejected`, actions `retry` (retry now), `discard`, `keepServer` (resolve a conflict by keeping the server's state), `applyTerminal` (apply this terminal's change instead), empty states `emptyQueue`, `emptyConflicts`.
- `nav.sync`: sidebar label under Administration.
Keep keys and `{placeholders}` unchanged; key sets identical between `en` and `uz`. Glossary: Sync → Sinxronlash, Offline → Oflayn, Online → Onlayn, Queue → Navbat (already there), Conflict → Ziddiyat, Terminal → Terminal, Pending → Kutilmoqda, Rejected → Rad etilgan. Add what you coin.

Then review in context with the `owner@malika.uz` login (credentials in `server/.env`): open `/sync`, both tabs; then stop the API (or set the browser to offline in DevTools → Network), scan an in-stock device at `/pos`, check out and read the queued toast and the header pill; bring the API back and watch the pill clear. Fix wording that reads as literal translation; the pill text must stay very short.

`pnpm lint` and `pnpm build` green in `client/`. Commit as `feat(client): uzbek copy for offline sync` adding only the i18n files and the glossary. Fill the Result section of `docs/handoffs/gemini/013-uzbek-offline-sync.md`, set Status to done.
=== END ===

## Result (Gemini fills)
- Commit:
- Glossary terms added:
- Wording changes proposed for `en`:
- Notes for other agents:
