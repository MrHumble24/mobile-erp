# backups

Company-wide backup & restore (handoff 023, ADR 0051): one backup covers every branch, no store scope. The most dangerous feature in the system.

## The file (`*.mbk`)

An encrypted tar of `manifest.json` + `database.dump` (pg_dump custom) +
`uploads.tar`. AES-256-GCM, scrypt key; metadata in the GCM-AAD header (readable without the passphrase). Streamed; capped.

## Storage places (ADR 0056)

`storage/backup-storage.ts` is the interface. Add one: an adapter, its class in
`STORAGE_ADAPTERS`, a `backup_providers` row, its secret kinds in
`providers/provider-secrets.ts` — no switch. Shipped: `LOCAL` (always on),
`TELEGRAM` (≤19 MB parts, `delete:false`), `GOOGLE_DRIVE`, `ONEDRIVE` (OAuth +
PKCE). A run succeeds when LOCAL did; a failed remote is partly-failed per
target. Manage: `GET /backups/places` · `PUT /places/:code/enabled|settings|
secret` · `POST /places/:code/test|disconnect`. OAuth: `GET
/backups/oauth/:code/start` · public `…/callback` · `…/redirect-uri`.

## HTTP (`/backups`, ADR 0045: no `X-Store-Id`)

`backup.read` to look, `backup.manage` to act, `backup.restore` to restore.
`GET /` runs · `GET|PUT /settings` (`passphraseStatus`) · `PUT /passphrase` ·
`GET /providers` · `POST /` (one at a time) · `GET /:id/download` · `DELETE /:id`.
The runs list is reconciled against LOCAL files at boot + after a restore (T2).
Restore: `POST /:id/restore`, or two-step upload (`POST /uploads` → `{uploadId,
migrationName…}` then `POST /uploads/:id/restore`), both `{shopName, password}`.
`GET /restore/status` → `{restoring, needsManualRecovery, last}`.

**Restore (ADR 0051):** confirm → safety backup → maintenance → `pg_restore
--single-transaction` → migrate → swap uploads → end sessions. A later failure
rolls DB + uploads back to the safety backup; a failed rollback stays in
maintenance (`tsx scripts/clear-recovery.ts`). Download tries LOCAL then a remote.

## Must never

- Return, log or URL a secret — only booleans; pg/provider errors server-side.
- Trust an archive entry name (block absolute, `..`, links on extract).
- Take a provider host or OAuth return URL from the request; run >1 instance.
