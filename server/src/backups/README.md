# backups

Company-wide backup & restore (handoff 023, ADR 0051): one backup covers every branch, no store scope. The most dangerous feature in the system.

## The file (`*.mbk`)

An encrypted tar of `manifest.json` + `database.dump` (pg_dump custom) +
`uploads.tar`. AES-256-GCM, scrypt key; the plaintext header holds metadata as
GCM AAD (tamper-evident, readable without the passphrase). Streamed; payload
capped. See `lib/`.

## Storage adapters

`storage/backup-storage.ts` is the interface. Add a provider: one adapter, add
its class to `STORAGE_ADAPTERS`, add one `backup_providers` row — no switch.
`LOCAL` ships (a folder outside uploads, never served over HTTP).

## HTTP (`/backups`, ADR 0045: no `X-Store-Id`)

`backup.read` to look, `backup.manage` to act, `backup.restore` to restore.
`GET /` runs · `GET|PUT /settings` (`passphraseStatus: set|missing|unreadable`) ·
`PUT /passphrase` · `GET /providers` · `POST /` (one at a time) ·
`GET /:id/download` · `DELETE /:id`. The list is reconciled against LOCAL files
at boot and after a restore (T2). Restore: `POST /:id/restore`; upload is two
steps — `POST /uploads` (raw `.mbk` → staging, returns `{uploadId,
migrationName…}`) then `POST /uploads/:id/restore`, both `{shopName, password}`.
`GET /restore/status` → `{restoring, needsManualRecovery, last}`.

**Restore order (ADR 0051):** confirm + extract uploads → safety backup →
maintenance → `pg_restore --single-transaction` → migrate → swap uploads → end
sessions. A later failure rolls the DB and uploads back to the safety backup; if
that too fails it stays in maintenance for manual recovery (fix by hand, then
`tsx scripts/clear-recovery.ts`). Maintenance, markers and the DB session cutoff
live in `common/runtime`.

## Must never

- Return, log or URL a secret — only booleans; pg stderr is server-side only.
- Trust an archive entry name (block absolute, `..`, links on extract).
- Run pg tools via a shell, skip the shop/password check, or run >1 instance.
