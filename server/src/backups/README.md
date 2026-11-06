# backups

Company-wide backup & restore (handoff 023, ADR 0051). No store scope: one
backup covers every branch. The most dangerous feature here — see SAFETY below.

## The file (`*.mbk`)

An encrypted tar of `manifest.json` + `database.dump` (pg_dump custom) +
`uploads.tar`. AES-256-GCM, key derived from the passphrase with scrypt (fresh
salt per file, stored in the plaintext header). Nothing is held whole in memory.
`lib/backup-crypto.ts` (cipher), `lib/mbk-format.ts` (pack/open),
`lib/archive.ts` (safe tar), `lib/pg-tools.ts` (spawned pg_dump/restore).

## Storage adapters

`storage/backup-storage.ts` is the interface. Add a provider: write one adapter
that implements it, add its class to `STORAGE_ADAPTERS` in `backups.module.ts`,
add one row to the `backup_providers` lookup. No switch on the code anywhere.
Shipped: `LOCAL` (a folder outside uploads, never served).

## HTTP (`/backups`, ADR 0045: no `X-Store-Id`)

`backup.read` to look, `backup.manage` to act, `backup.restore` to restore.
`GET /` runs · `GET|PUT /settings` · `PUT /passphrase` (write-only) ·
`GET /providers` · `POST /` (make now) · `GET /:id/download` · `DELETE /:id`.
Restore routes: see `restore.*` (Part 2). One backup at a time (`BACKUP_RUNNING`).

## Must never

- Return, log, or URL-encode a secret (passphrase, token). Responses carry only
  `passphraseSet` / `connected` booleans.
- Trust a name from inside an archive (block absolute, `..`, links on extract).
- Run pg tools through a shell, or put the DB password on the command line.
- Restore without the shop name + password re-check (Part 2).
