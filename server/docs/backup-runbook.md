# Backup & restore runbook

Encrypted daily Postgres backups (PRD §5, ADR 0010). Scripts in `server/scripts/`.
Set `BACKUP_PASSPHRASE`, `BACKUP_DIR`, `BACKUP_RETENTION_DAYS` in `server/.env`
(see `.env.example`). The passphrase lives in the password manager, never in git.

## Daily backup

Manual: `pnpm backup:db` (from `server/`).

Schedule after closing (21:00). Pick ONE.

### Linux / cron
```
crontab -e
0 21 * * * cd /path/to/mobile-erp/server && /bin/sh scripts/backup-db.sh >> backups/backup.log 2>&1
# Off-machine copy, 15 min later (see ADR 0010):
15 21 * * * cd /path/to/mobile-erp/server && rclone copy backups remote:malika-backups
```

### macOS / launchd
`~/Library/LaunchAgents/uz.malika.backup.plist`:
```xml
<plist version="1.0"><dict>
  <key>Label</key><string>uz.malika.backup</string>
  <key>ProgramArguments</key>
  <array><string>/bin/sh</string><string>/path/to/mobile-erp/server/scripts/backup-db.sh</string></array>
  <key>WorkingDirectory</key><string>/path/to/mobile-erp/server</string>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>21</integer><key>Minute</key><integer>0</integer></dict>
</dict></plist>
```
`launchctl load ~/Library/LaunchAgents/uz.malika.backup.plist`

## Verify (weekly)
`pnpm backup:verify backups/mobile_erp_<ts>.dump.enc`
Decrypts and runs `pg_restore --list`; exits non-zero if the passphrase is wrong
or the archive is corrupt. Do this on the latest dump every week.

## Restore (disaster)
1. Put the chosen `.dump.enc` (and its `.sha256`) on the machine.
2. Set `BACKUP_PASSPHRASE` and `DATABASE_URL` (target DB) in the env.
3. `CONFIRM=yes pnpm backup:restore backups/mobile_erp_<ts>.dump.enc`
   - Verifies the checksum, decrypts to a temp file, then
     `pg_restore --clean --if-exists --no-owner` into `DATABASE_URL`.
   - DESTRUCTIVE: it drops and recreates objects in the target DB.
4. Confirm app starts and recent sales/devices are present.

## If the passphrase is lost
Nothing can be done. AES-256 dumps are unrecoverable without it. There is no
backdoor by design. This is why the passphrase must stay in the password manager.
