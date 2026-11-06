# feature: set-backup-passphrase

Set the encryption passphrase that every backup is sealed with.

## Owns
- `PassphraseCard` — shows the state in words (set / not set / must be re-typed on this server), a write-only new + confirm field, and the one warning that without it no backup can be opened and nobody can recover it.
- `makePassphraseSchema(t)` — min 8 chars, confirm must match (bilingual messages).

## Must never
- Read or display the current passphrase — it is write-only server-side.
