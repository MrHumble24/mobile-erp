# secrets

Encrypted secret storage for third-party tokens and credentials (ADR 0054).

## What it owns

- AES-256-GCM symmetric encryption of stored secrets in the `app_secrets` table.
- Master key generation and storage in `<DATA_DIR>/master.key` (mode 0o600).
- `MASTER_KEY` environment variable override.
- Secret management API for server-side code: `get()`, `set()`, `isSet()`, `delete()`.

## Must never

- Return any secret plaintext over HTTP or in any client/audit response.
- Log secrets or write unencrypted credentials to disk or the database.
