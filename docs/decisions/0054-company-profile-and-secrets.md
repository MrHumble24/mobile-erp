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
- **Master key**: Stored in `<DATA_DIR>/master.key` with owner-only permissions (0o600).
  Overridable via `MASTER_KEY` environment variable.
- **Secrets store**: Symmetrically encrypted with AES-256-GCM in the `app_secrets` table.
  Server code accesses secrets via `SecretsService`. No HTTP endpoint ever returns
  a secret plaintext or ciphertext.
- **Telegram bot token**: Read from `app_secrets` first, falling back to `TELEGRAM_BOT_TOKEN`.
  Manageable via `PUT /settings/telegram-token` with test message trigger.
- **Branding endpoint**: `GET /branding` is public and cacheable, exposing only company name,
  logo URL, theme code, default language, and currency formatting.

## Consequences
- Environments only need `DATABASE_URL`, `PORT`, and optional `DATA_DIR`.
- Existing databases migrate cleanly with fallback values populated from the primary store.
