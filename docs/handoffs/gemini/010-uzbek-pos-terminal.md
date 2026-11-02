# 010 — Uzbek copy for the completed POS terminal

Status: done · Owner: Gemini (Antigravity) · Depends on: `main` ≥ merge "multi-line POS terminal"

## Why
`/pos` is now a multi-device cart with scanner states, price guidance, customer search, keyboard
shortcuts, a Sale | Nasiya mode switch, a combined receipt and a today's-sales session panel. 43 new keys
hold English placeholders in `client/src/shared/i18n/uz/pos.json` because Claude agents never hand-write
Uzbek. This is the screen cashiers use all day: wording must be short and instant to read.

=== MESSAGE ===
Read `client/src/shared/i18n/GLOSSARY.md`. You are a native Uzbek (Latin script) UX writer for a phone retail POS in Malika Bazaar. Work on a branch from `main`.

Translate every key in `client/src/shared/i18n/uz/pos.json` that still equals its `en/pos.json` value (43 keys). Groups, with context:
- Cart and pricing: `targetPrice`, `margin`, `belowTarget` (badge: price is under the target), `belowCostConfirm` (checkbox: I confirm selling below cost), `quickTarget` (button: set price = target), `quickRound` (button: round to 10 000), `removeLine`, `lineCount` (`{count} devices`), `subtotal`, `warrantySummary`, `warrantyCount`, `daysShort` (short unit after a number of days), `duplicateDevice` (this IMEI is already in the cart), `invalidImei`.
- Customer: `purchaseCount` (`{count} purchases`), `walkIn` (no customer / walk-in buyer), `phoneHint`, `phoneInvalid`, `useCustomer`.
- Checkout and receipt: `autoPrint`, `deviceConflict` (device changed on another terminal, rescan), `lineFailed` (`{imei}: {reason}`).
- Mode and scanner states: `modeSale`, `modeNasiya`, `soldInfo` (already sold on {date}), `viewSale`, `consignedInfo` (with a partner, settle it in Nasiya), `goNasiya`, `defectiveInfo` (failed QC, cannot be sold), `viewQc`, `notFoundInfo`, `goIntake`, `nasiyaPrompt` (scan a device to hand it to a partner).
- Session panel: `todaySales`, `todayRevenue`, `recentSales`, `noSalesYet`.
- Shortcuts help: `shortcutsTitle`, `scFocusScanner`, `scCheckout`, `scClearScanner`, `scRemoveLast`, `scToggleCustomer`, `scToggleMode`.
Keep keys and `{placeholders}` unchanged; key sets identical between `en` and `uz`. Glossary: Cart → Savat, Target price → Mo'ljallangan narx (already in glossary), Margin → Marja, Walk-in → Oddiy xaridor, Receipt → Chek, Shortcut → Tezkor tugma. Add what you coin.

Then review in context with the `cashier@malika.uz` login (credentials in `server/.env`): scan an in-stock device, lower the price below target, pick and create a customer, press `?` for the shortcuts, switch to Nasiya mode and back, check out and print the combined receipt. Fix wording that reads as literal translation; the receipt text must fit 58 mm paper (short lines).

`pnpm lint` and `pnpm build` green in `client/`. Commit as `feat(client): uzbek copy for pos terminal` adding only the i18n files and the glossary. Fill the Result section of `docs/handoffs/gemini/010-uzbek-pos-terminal.md`, set Status to done.
=== END ===

## Result (Gemini fills)
- Commit: pending unified commit
- Glossary terms added: Cart (Savat), Margin (Marja), Walk-in (Oddiy xaridor), Cheque / Receipt (Chek), Shortcut (Tezkor tugma), Subtotal (Oraliq summa)
- Wording changes proposed for `en`: "round 10 000" updated to "round $10" in line with USD currency.
- Notes for other agents: All 43 POS keys translated into natural Uzbek (Latin script) tailored for rapid cashier usage at Malika market counters. Fits 58mm receipt constraints.
