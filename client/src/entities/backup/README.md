# entity: backup

Data layer for backup & restore (server ADR 0051 / 0056, `/backups`). Company-wide — no store scope.

## Owns
- Types mirroring the server views (`BackupRunView`, `BackupSettingsView`, `PlaceView`, `RestoreStatusView`, `StagedUpload`).
- `backupRepository` — the only caller of `/backups` (reads, settings, passphrase, places, OAuth start, backup-now, download blob, delete, restore, raw upload).
- Query-key factory `backupKeys`.
- Hooks (`model/use-backup-*.ts`): runs, settings, places, restore, OAuth. One concern per file.
- `backupErrorCode(err)` / `errorStatus(err)` — read the stable `code` (via the shared
  `httpErrorCode`) and status from a failed response.

## Exposes
The hooks, repository, keys, types and error helpers via `index.ts`.

## Must never
- Hold a secret (bot token, OAuth client secret, passphrase) in state — they are write-only server-side.
- Talk HTTP except through `shared/api/http`. Raw `.mbk` upload and blob download use `uploadRaw` / `downloadBlob` there.
- Scope anything by store (`X-Store-Id`); backups are company-wide.
