# backups

Company-wide backup & restore (handoff 023, ADR 0051). No store scope: one
backup covers every branch. The most dangerous feature in the system.

## The file (`*.mbk`)

An encrypted tar of `manifest.json` + `database.dump` (pg_dump custom) +
`uploads.tar`. AES-256-GCM, key from the passphrase via scrypt (fresh salt per
file, in the plaintext header). Nothing is held whole in memory. See `lib/`:
`backup-crypto`, `mbk-format`, `archive` (safe tar), `pg-tools` (spawned).

## Storage adapters

`storage/backup-storage.ts` is the interface. Add a provider: write one adapter,
add its class to `STORAGE_ADAPTERS` in `backups.module.ts`, add one
`backup_providers` row. No switch on the code. Shipped: `LOCAL` (a folder outside
uploads, never served).

## HTTP (`/backups`, ADR 0045: no `X-Store-Id`)

`backup.read` to look, `backup.manage` to act, `backup.restore` to restore.
`GET /` runs · `GET|PUT /settings` · `PUT /passphrase` (write-only) ·
`GET /providers` · `POST /` (make now, one at a time: `BACKUP_RUNNING`) ·
`GET /:id/download` · `DELETE /:id`.

## Restore (`backup.restore`, `restore.*`)

`POST /:id/restore` `{shopName, password}`; `POST /restore-upload` (raw `.mbk`
body + `x-restore-*` headers, streamed to disk); `GET /restore/status`. Order
(ADR 0051): confirm → safety backup → maintenance (503 everywhere but health +
restore status) → `pg_restore --single-transaction` → migrate → swap uploads →
end every session → leave maintenance; any failure rolls back. Maintenance +
session cutoff (surviving the restore in DATA_DIR) live in `common/runtime`.

## Must never

- Return, log, or URL-encode a secret (passphrase, token) — only booleans.
- Trust a name from inside an archive (block absolute, `..`, links on extract).
- Run pg tools through a shell, or restore without the shop-name + password check.
