# settings

Store-wide configuration singleton (PRD Module 6), `store_settings` row id = 1.

## Owns

- telegramChatId, closingTime ("HH:mm"), defaultWarrantyDays, minMarginPercent
  (0–100), lowStockThreshold. The bot token lives in env, not here.

## Exposes

- REST `/settings`:
  - `GET` — any authenticated user (the client needs defaultWarrantyDays /
    closingTime for POS and the digest).
  - `PUT` — `settings.manage`; upserts id = 1 so a fresh DB works before seed.
- `SettingsService.get()` — the public API for later waves (warranty default,
  Telegram daily digest, margin alerts) via DI. Returns schema defaults if the
  row is somehow absent.

## Must never

- Expose write access without `settings.manage`, or store the bot token.
