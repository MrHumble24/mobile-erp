# page: backups

Route `/backups` (permission `backup.read`). Company-wide backup & restore — not tied to the store picker.

## Composes
- `features/set-backup-passphrase` (passphrase card) · `features/edit-backup-schedule` (schedule) · `features/restore-backup` (upload restore).
- `widgets/backup-places` (the storage places) · `widgets/backup-runs` ("Back up now" + the list with download / delete / restore).
- Reads `backup.manage` / `backup.restore` from the auth store to gate the write actions.

## Owns
- The OAuth return handling: the server redirects back here with `?backupConnected=` / `?backupError=`; the page toasts, refreshes the places and cleans the URL.

The global "restoring, please wait" screen is `widgets/restore-overlay`, mounted app-wide, not here.
