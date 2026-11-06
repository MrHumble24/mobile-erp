# 0051 — Backup and restore, in the app, with storage providers

Date: 2026-11-06
Status: Accepted (supersedes ADR 0010)

## Context
ADR 0010 put backups in shell scripts run by hand on the till — no pictures, no
schedule, nowhere off-machine. The user wants it in the app: scheduled and
manual, encrypted, sent to several places, restorable.

## Decision
- **One encrypted file** (`*.mbk`): a tar of `manifest.json` + `database.dump`
  (pg_dump custom) + `uploads.tar`, **AES-256-GCM**, key from a passphrase via
  **scrypt** (fixed params, fresh salt). The plaintext header carries metadata
  (run id, time, migration) as GCM AAD, so it is tamper-evident and readable
  without the passphrase. Streamed; the payload is capped (`BACKUP_MAX_PAYLOAD_
  BYTES`, 32 GiB) well under the GCM limit.
- **Secrets** (`src/secrets`): AES-256-GCM under an app master key in `DATA_DIR`
  (owner-only, exclusive-created; `APP_MASTER_KEY` overrides), never in the DB.
  A secret reads as set / missing / **unreadable** (wrong key → clear 400, not 500).
- **Storage is an adapter** (`BackupStorage`): one DI array, no switch. A
  provider = one file + one module line + one lookup row (ADR 0056 adds three).
- **pg tools** spawn with an argv array, never a shell; the password is in the
  child env; stderr is logged server-side, never returned (Railway: `nixpacks`).
  The runs table is reconciled against LOCAL files at boot and after a restore.
- **Session cutoff** lives in the database (`session_gate`), so a restore writes
  it into the restored state and it survives a redeploy; the guard fails closed.
- **Restore is all-or-nothing**: verify + extract uploads before the DB is
  touched → safety backup → maintenance (503 but health + restore status) →
  `pg_restore --single-transaction` → migrate → swap uploads (renames) → end
  sessions. Any later failure rolls the DB and uploads back to the safety backup;
  only if that rollback also fails does it stay in maintenance for manual
  recovery (persisted marker, `scripts/clear-recovery.ts`). Confirmed with the
  shop name + caller's password; `backup.restore` only. **Single instance only.**

## Consequences
- Lose the passphrase **or** the master key = backups are unrecoverable.
- `scripts/open-backup.ts` opens a backup with no app or DB. Old `.sh` removed.
- A successful restore wipes its own audit row; re-recorded by upsert. Lookups
  not enums; one backup covers all branches.
