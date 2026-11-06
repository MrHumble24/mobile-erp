# 0054 — Company profile and encrypted secrets store

Date: 2026-11-06
Status: Accepted

## Context
Shop branding (name, legal name, logo, address, currency, time zone, theme) belongs
to the company rather than individual branches. Third-party tokens (Telegram bot,
future cloud drives) must be stored securely without exposing credentials in HTTP responses.

## Decision
- **Company profile singleton**: Stored in `company_profiles` (`id = 'default'`).
  Branches remain in `stores` and keep branch-specific address, phone, and receipt footers.
- **Unified secrets store**: Uses `main`'s audited `secrets` table sealed under `APP_MASTER_KEY`
  via `AppKeyService` and `SecretsService`. No second secrets store or plaintext storage.
- **Telegram bot token**: Single token stored under key `provider.telegram.bot_token` for both
  digests and backups. Unreadable tokens report actionable error ("type it again").
- **Branding endpoint**: `GET /branding` is public and cacheable, exposing only company name,
  logo URL, theme code, default language, and currency formatting (returns null name before setup).
- **Time zone & session duration**: `timeZone` must be a valid `Intl.supportedValuesOf('timeZone')`.
  `sessionDuration` accepts values between 5m and 30d, falling back safely to 12h default.

## Consequences
- Environments only need `DATABASE_URL`, `PORT`, and optional `DATA_DIR`.
- Existing databases migrate cleanly with fallback values populated from the primary store.
