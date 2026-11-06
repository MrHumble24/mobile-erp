# widget: backup-runs

The list of backup runs and the per-run actions, plus "Back up now".

## Composes
- `entities/backup` (runs query, download) · `features/run-backup` (the button) · `features/restore-backup` (the restore dialog).
- `BackupRunRow` — date, size, who/"schedule", a mark per place (`TargetMarks`), status (partly-failed flagged), and Download / Restore / Delete.
- `DeleteRunDialog` — confirmation before a run is removed.

Download and Restore show only when the run is still `downloadable` (a copy can be fetched). Restore also needs `backup.restore`.
