#!/bin/sh
# Daily encrypted Postgres backup (PRD §5).
# pg_dump --format=custom | openssl AES-256-CBC -> ${BACKUP_DIR}/mobile_erp_<UTC>.dump.enc
# Writes a .sha256 sidecar and prunes files older than BACKUP_RETENTION_DAYS.
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SERVER_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
ENV_FILE="${BACKUP_ENV_FILE:-$SERVER_DIR/.env}"

die() { echo "backup-db: $1" >&2; exit 1; }

# Load server/.env only for values not already in the environment.
if [ -z "${DATABASE_URL:-}" ] || [ -z "${BACKUP_PASSPHRASE:-}" ]; then
  if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$ENV_FILE"
    set +a
  fi
fi

command -v pg_dump >/dev/null 2>&1 || die "pg_dump not found on PATH"
command -v openssl >/dev/null 2>&1 || die "openssl not found on PATH"
[ -n "${DATABASE_URL:-}" ]     || die "DATABASE_URL is empty"
[ -n "${BACKUP_PASSPHRASE:-}" ] || die "BACKUP_PASSPHRASE is empty"

if command -v sha256sum >/dev/null 2>&1; then
  sha256() { sha256sum "$1"; }
elif command -v shasum >/dev/null 2>&1; then
  sha256() { shasum -a 256 "$1"; }
else
  die "no sha256 tool (need sha256sum or shasum)"
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
mkdir -p "$BACKUP_DIR"

TS=$(date -u +%Y%m%dT%H%M%SZ)
NAME="mobile_erp_$TS.dump.enc"
OUT="$BACKUP_DIR/$NAME"

export BACKUP_PASSPHRASE
# ponytail: POSIX sh has no pipefail; a pg_dump failure mid-pipe is not caught
# here. verify-backup.sh (run weekly, see runbook) is the integrity check.
pg_dump --format=custom --dbname="$DATABASE_URL" \
  | openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_PASSPHRASE -out "$OUT"

# Checksum with a basename so `sha256 -c` works from inside BACKUP_DIR.
( cd "$BACKUP_DIR" && sha256 "$NAME" > "$NAME.sha256" )

find "$BACKUP_DIR" -type f -name 'mobile_erp_*.dump.enc*' -mtime +"$RETENTION_DAYS" -delete

echo "backup-db: wrote $OUT"
