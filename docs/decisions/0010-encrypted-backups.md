# 0010 — Encrypted database backups

Date: 2026-11-01
Status: Superseded by ADR 0051 (2026-11-06)

> The shell scripts described here are removed. Backups now live in the app
> (module `server/src/backups`, ADR 0051): encrypted `.mbk` files covering the
> database **and** the uploads, scheduled or manual, with restore and storage
> providers. Kept for history.

## Context
PRD §5 requires daily automated encrypted database backups so inventory and the
ledger survive a disk or ransomware loss on the single shop PC (Malika Bazaar).
The machine is a retail counter PC, not a server: whatever we pick must run with
tools already present, no admin installs, no daemon to babysit.

## Decision
Plain shell scripts in `server/scripts/`, no Nest code:
- `pg_dump --format=custom` piped into `openssl enc -aes-256-cbc -pbkdf2 -salt`
  with a passphrase from `BACKUP_PASSPHRASE`. Output:
  `${BACKUP_DIR}/mobile_erp_<UTC>.dump.enc` + a `.sha256` sidecar.
- Custom format (not plain SQL) so `pg_restore --clean --if-exists` can rebuild
  selectively and `pg_restore --list` can verify readability.
- `openssl` over age/gpg: openssl ships with Postgres/macOS/git already on the PC;
  age or gpg would be one more thing to install and keep updated on a till.
- Retention: delete encrypted dumps older than `BACKUP_RETENTION_DAYS` (default 30).
- The passphrase lives in the owner's password manager only, never in git, never
  in a committed `.env`. `.env.example` documents it; `backups/` is gitignored.

## Consequences
- Lose the passphrase = every dump is unrecoverable. Documented loudly in the
  runbook and `.env.example`; mitigation is the password manager, not the code.
- Backups are only as safe as their off-machine copy. A second copy is required:
  one cron line after the dump, e.g.
  `15 21 * * * rclone copy server/backups remote:malika-backups` (or rsync to a
  second disk). Documented in the runbook; not implemented here (no cloud creds
  in scope).
- Symmetric passphrase, not asymmetric: anyone who can read `.env` can decrypt.
  Acceptable for a single-operator shop; revisit if staff accounts touch the PC.
