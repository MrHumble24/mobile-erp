# settings

Store-wide configuration singleton (PRD Module 6), `store_settings` row id = 1.

## Owns

- telegramChatId, closingTime ("HH:mm"), defaultWarrantyDays, minMarginPercent
  (0–100), lowStockThreshold. The bot token lives in env, not here.
- `digestSentOn` (`@db.Date`, nullable) — the day the Telegram closing digest
  last went out, so the minute-cron fires it once per day. Written only by
  `SettingsService.markDigestSent(date)`; not exposed on the write DTO.

## Exposes

- REST `/settings`:
  - `GET` — any authenticated user (the client needs defaultWarrantyDays /
    closingTime for POS and the digest).
  - `PUT` — `settings.manage`; upserts id = 1 so a fresh DB works before seed.
- `SettingsService.get()` — the public API for later waves (warranty default,
  Telegram daily digest, margin alerts) via DI. Returns schema defaults if the
  row is somehow absent.
- `SettingsService.markDigestSent(date)` — upserts `digestSentOn` for the
  Telegram closing-digest cron.

## Must never

- Expose write access without `settings.manage`, or store the bot token.
