# telegram

Outbound Telegram alerts for the owner (PRD Module 6). No HTTP routes.

## Owns

- `TelegramService.send(text)` — posts to the Bot API with global `fetch`.
  Token from `TELEGRAM_BOT_TOKEN`, chat id from `SettingsService.get()`. Missing
  either → logs once at debug and no-ops; **never throws into the caller**.
- `messages.ts` — **every** message string, as functions returning English.
  Gemini translates these to Uzbek via a handoff; keep nothing inline.
- `TelegramListener` — reacts to domain events (`events/`), emitted by the owning
  services: shipment intake, below-margin sale (salePrice < target OR margin% <
  `minMarginPercent`), consignment created, partner payment. After a sale or a
  consignment it also sends a low-stock list (`StockAlertRulesService.lowStock`),
  deduped by a per-process fingerprint so the same list is not re-sent.
- `TelegramCron` — overdue consignments **and overdue customer credit** daily at
  09:00 (credit via `CreditsReadService.overdue`, ADR 0035); closing digest every
  minute, gated by `shouldSendDigest` against `closingTime` and the
  `StoreSettings.digestSentOn` once-per-day marker. Digest content from
  `ReportsService.dailyClosing` + total outstanding (sum of partner balances) +
  per-account opening/closing balances from `LedgerService.digestBalances`
  (2c; same UTC-day boundary — this module never queries ledger tables).

## Pure, unit-tested logic

`lib/margin.ts` (below-margin decision) and `lib/digest-schedule.ts`
(once-per-day guard) are clock/service-free so they test without mocks.

## Must never

Throw from a listener/cron into a sale or request; hold a message string outside
`messages.ts`; store the bot token anywhere but env.
