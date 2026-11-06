# feature: manage-backup-place

One storage place (server disk, Telegram, Google Drive, OneDrive) and its actions.

## Owns
- `PlaceCard` — label, status in words, last success / last error, the on/off switch, Test and Disconnect. LOCAL is shown always-on and locked; an unavailable provider says so.
- `TelegramConfig` — write-only bot token + backup chat id, with the "private chat/channel, backups are not deleted there" note.
- `OAuthConfig` — write-only client id/secret, the redirect address to register (copyable), Connect (OAuth start → provider consent), and the connected account.
- `SecretField` — a write-only secret input; the current value is never shown.

## Must never
- Display a secret value — the server only reports presence (`configured`/`connected`).
- Build a provider host or redirect from user input; the redirect URI comes from the server.
