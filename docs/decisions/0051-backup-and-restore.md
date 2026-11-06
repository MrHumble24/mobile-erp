# 0051 — Backup and restore, in the app, with storage providers

Date: 2026-11-06
Status: Accepted (supersedes ADR 0010)

## Context
The shop's business lives in one database and one folder of pictures. ADR 0010
put backups in shell scripts (`pg_dump | openssl`) run by hand on the till — no
pictures, no schedule, no screen, nowhere off-machine. The user wants it in the
app: scheduled and manual, encrypted, sent to several places, restorable.

## Decision
- **One encrypted file** (`*.mbk`): a tar of `manifest.json` + `database.dump`
  (pg_dump custom format) + `uploads.tar`, encrypted with **AES-256-GCM**, key
  derived from a passphrase with **scrypt** (fresh salt per file, in the
  plaintext header). Streamed, never wholly in memory. A changed byte or wrong
  key fails the GCM tag; the manifest SHA-256s cross-check each part.
- **Secrets** live in a small encrypted store (`src/secrets`): AES-256-GCM under
  an app master key kept in `DATA_DIR` (a file, owner-only; `APP_MASTER_KEY`
  overrides), never in the database. No route returns a secret. The backup
  passphrase is secret `backup.passphrase`; env `BACKUP_PASSPHRASE` is a fallback.
- **Storage is an adapter** (`BackupStorage`): one DI array, no switch on the
  code. A provider = one file + one line in the module + one lookup row. `LOCAL`
  ships; Telegram, Google Drive, OneDrive follow unchanged.
- **pg_dump/pg_restore** are spawned with an argument array, never a shell; the
  password goes in the child env (PGPASSWORD). A missing or older-than-server
  client fails the backup. Railway gets them via `nixpacks.toml` (postgresql_17).
- **Restore is all-or-nothing** (`pg_restore --single-transaction`): verify, make
  a safety backup, enter maintenance (503 everywhere but health + restore
  status), restore, migrate, swap uploads, end every session, leave maintenance.
  Any failure leaves the database and uploads untouched. Confirmed with the shop
  name + the caller's password; `backup.restore` only. Lookups not enums; one
  backup covers all branches (no store scope). One dependency: `tar`.

## Consequences
- Lose the passphrase **or** the master key = backups are unrecoverable.
- `scripts/open-backup.ts` (`tsx`) opens a backup with no app or database — the
  escape hatch when the server is gone. The old `.sh` scripts are removed.
- A restore wipes its own RUNNING audit row, so the outcome is re-recorded by
  upsert (best-effort). GCM authenticates only at stream end.
