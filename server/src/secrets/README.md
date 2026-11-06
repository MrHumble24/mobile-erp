# secrets

A small, general encrypted store for named secrets (handoff 023). The backup
passphrase lives here; provider OAuth tokens will (handoff 024).

## Owns

- `secrets` table — one row per secret, value sealed as `iv ++ tag ++ ciphertext`
  with AES-256-GCM (`lib/aes-gcm.ts`).
- The **app master key** (`AppKeyService`) — 32 random bytes made once
  (exclusive-create, so a boot race cannot fork two keys) and kept in
  `DATA_DIR/master.key` (owner-only; a group/other-readable file is warned),
  never in the database. Env `APP_MASTER_KEY` (hex, or base64 that round-trips,
  32 bytes) overrides the file.

## Exposes (server code only — no HTTP here)

- `SecretsService.set(name, value)` — seal and upsert.
- `SecretsService.isSet(name)` — boolean; the only thing a route may surface.
- `SecretsService.state(name)` — `set | missing | unreadable`. Lets a feature
  answer a clear 400 (not 500) when the master key no longer opens the secret.
- `SecretsService.read(name)` — plaintext, or null; throws on `unreadable`.
- `SecretsService.clear(name)`.

Global module, so any feature can inject it.

## Must never

- Return a secret value from any route, log it, or put it in a URL.
- Keep the master key in the database (a leaked dump stays unreadable).
