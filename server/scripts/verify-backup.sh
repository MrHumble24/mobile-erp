#!/bin/sh
# Prove an encrypted backup is decryptable and the archive is readable.
# Run weekly (see docs/backup-runbook.md). Non-destructive.
# Usage: sh scripts/verify-backup.sh path/to/mobile_erp_<ts>.dump.enc
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SERVER_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
ENV_FILE="${BACKUP_ENV_FILE:-$SERVER_DIR/.env}"

die() { echo "verify-backup: $1" >&2; exit 1; }

[ "${1:-}" ] || die "usage: verify-backup.sh <file.dump.enc>"
FILE="$1"
[ -f "$FILE" ] || die "no such file: $FILE"

if [ -z "${BACKUP_PASSPHRASE:-}" ] && [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

command -v pg_restore >/dev/null 2>&1 || die "pg_restore not found on PATH"
command -v openssl >/dev/null 2>&1    || die "openssl not found on PATH"
[ -n "${BACKUP_PASSPHRASE:-}" ]        || die "BACKUP_PASSPHRASE is empty"

export BACKUP_PASSPHRASE
TMP=$(mktemp "${TMPDIR:-/tmp}/mobile_erp_verify.XXXXXX")
trap 'rm -f "$TMP"' EXIT INT TERM
openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_PASSPHRASE -in "$FILE" -out "$TMP" \
  || die "decryption failed (wrong passphrase or corrupt file)"
pg_restore --list "$TMP" >/dev/null || die "archive is not a readable pg_dump custom archive"

echo "verify-backup: OK $FILE"
