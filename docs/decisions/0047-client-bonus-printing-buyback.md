# 0047 — Client: bonus points, receipt and price-tag printing, buy-back messages

Date: 2026-11-06
Status: Accepted

## Context
Step 11 on the website: loyalty points at the till, receipt and price-tag
printing, and translated messages for the server's buy-back, return and trade-in
refusals. The server work is ADR 0043/0044; this records the client choices.
Built while the user slept; the recommended options are taken and recorded here.

## Decision
- **Settings switches.** `StoreSettings` carries `bonusEnabled`,
  `bonusEarnPercent`, `bonusMaxRedeemPercent`, `receiptPrintingEnabled`,
  `receiptPaperWidthMm` (58/80, default 80) and `priceTagsEnabled`. The toggles
  are off by default and the paper width defaults to 80. The settings page edits them.
- **Points are points, never money.** Balances and redeemed/earned figures use
  `formatNumber`, not `formatMoney`, on the till, customers and receipt.
- **One tender plan.** `planBonusRedeem` sits on top of the trade-in plan and is
  shared over the cart's lines in cart order; `use-checkout` sends `bonusRedeem`
  per line and payments sum to price − trade-ins − points.
- **Online only.** A sale with points or a trade-in is never queued offline; a
  transport failure surfaces instead of entering the sync outbox.
- **One receipt source.** `receipt-bonus.ts` produces the receipt's points lines
  once, used by the printed receipt and the Telegram text.
- **Receipt presentation.** The shop name comes from the server (`store`), the
  paper follows `receiptPaperWidthMm` (58/80), and the printing switch hides
  Print but keeps "Copy for Telegram".
- **Price tags.** Pages map their rows to `PriceTagItem[]`; one feature
  (`features/print-price-tags`) renders and prints them.
- **Refusals by code.** `httpErrorCode` is the one reader of a server `code`;
  returns map `SALE_UNIT_BOUGHT_BACK` / `TRADE_IN_REFUND_FORBIDDEN`, and the till
  maps the four `TRADE_IN_*` and six `BONUS_*` codes. A not-sold buy-back refusal
  is the endpoint's 409 message (it sends no code). No client check blocks an
  IMEI because it was sold before; the server decides buy-back.

## Consequences
- The client shows translated text for every refusal above, not a server sentence
  or a raw key. A buy-back still uses the normal success toast: the server's
  purchase answer has no buy-back flag. Uzbek text is left for the translator.
