# feature: restore-backup

The dangerous action — replace the whole database and uploads from a backup.

## Owns
- `RestoreDialog` — the red confirmation (shop name typed exactly + the owner's password). Restores from a run id or a staged upload. On a started restore (202) the entity hook flips the global maintenance flag; the `restore-overlay` widget takes over the screen.
- `UploadRestoreCard` — choose a `.mbk`, stage it (`POST /backups/uploads`), show what the server read (date, size), then the same dialog.

## Must never
- Hold the owner's password beyond the request.
- Show a success toast and continue on the page: a real restore ends the session, so the overlay owns the aftermath.
