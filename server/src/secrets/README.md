# secrets

A small, general encrypted store for named secrets (handoff 023). The backup
passphrase lives here; provider OAuth tokens will (handoff 024).

## Owns

- `secrets` table — one row per secret, value sealed as `iv ++ tag ++ ciphertext`
  with AES-256-GCM (`lib/aes-gcm.ts`).
- The **app master key** (`AppKeyService`) — 32 random bytes made once and kept
  in `DATA_DIR/master.key` (owner-only, `0600`), never in the database. Env
  `APP_MASTER_KEY` (base64/hex, 32 bytes) overrides the file.

## Exposes (server code only — no HTTP here)

- `SecretsService.set(name, value)` — seal and upsert.
- `SecretsService.isSet(name)` — boolean; the only thing a route may surface.
- `SecretsService.read(name)` — plaintext, or null. **Server code only.**
- `SecretsService.clear(name)`.
- `AppKeyService.getKey()` / `dataDir()`.

Global module, so any feature can inject it.

## Must never

- Return a secret value from any route, log it, or put it in a URL.
- Keep the master key in the database (a leaked dump stays unreadable).
