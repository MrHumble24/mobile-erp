#!/bin/sh
# Restore an encrypted backup into DATABASE_URL. DESTRUCTIVE: drops/recreates objects.
# Usage: CONFIRM=yes sh scripts/restore-db.sh path/to/mobile_erp_<ts>.dump.enc
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SERVER_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
ENV_FILE="${BACKUP_ENV_FILE:-$SERVER_DIR/.env}"

die() { echo "restore-db: $1" >&2; exit 1; }

[ "${1:-}" ] || die "usage: CONFIRM=yes restore-db.sh <file.dump.enc>"
FILE="$1"
[ -f "$FILE" ] || die "no such file: $FILE"

if [ -z "${DATABASE_URL:-}" ] || [ -z "${BACKUP_PASSPHRASE:-}" ]; then
  if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$ENV_FILE"
    set +a
  fi
fi

command -v pg_restore >/dev/null 2>&1 || die "pg_restore not found on PATH"
command -v openssl >/dev/null 2>&1    || die "openssl not found on PATH"
[ -n "${DATABASE_URL:-}" ]      || die "DATABASE_URL is empty"
[ -n "${BACKUP_PASSPHRASE:-}" ] || die "BACKUP_PASSPHRASE is empty"
[ "${CONFIRM:-}" = "yes" ]      || die "refusing: set CONFIRM=yes (this overwrites $DATABASE_URL)"

if command -v sha256sum >/dev/null 2>&1; then
  sha256c() { sha256sum -c "$1"; }
elif command -v shasum >/dev/null 2>&1; then
  sha256c() { shasum -a 256 -c "$1"; }
else
  die "no sha256 tool (need sha256sum or shasum)"
fi

if [ -f "$FILE.sha256" ]; then
  ( cd "$(dirname "$FILE")" && sha256c "$(basename "$FILE").sha256" ) \
    || die "checksum mismatch for $FILE"
else
  echo "restore-db: WARNING no $FILE.sha256 sidecar, skipping integrity check" >&2
fi

export BACKUP_PASSPHRASE
TMP=$(mktemp "${TMPDIR:-/tmp}/mobile_erp_restore.XXXXXX")
trap 'rm -f "$TMP"' EXIT INT TERM
openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_PASSPHRASE -in "$FILE" -out "$TMP"
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" "$TMP"

echo "restore-db: restored $FILE into $DATABASE_URL"
