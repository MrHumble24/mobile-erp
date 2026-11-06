# 0052 — Backups & restore on the website

Date: 2026-11-06
Status: Accepted (client side of ADR 0051 / 0056; handoff 023 PART 5)

## Context
The server exposes `/backups` (company-wide; `backup.read|manage|restore`). The
website needs one screen to run it, and a restore replaces the whole system and
ends every session, so the UI must handle that safely.

## Decision
- **Own page** `/backups`, not a Settings section — too much for a section.
  Guarded by `backup.read`; nav item under Admin. Never store-scoped.
- **FSD**: entity `backup` (types mirroring the server, key factory,
  one repository, hooks split by concern, error helpers). Features = one action
  each: `set-backup-passphrase`, `edit-backup-schedule`, `run-backup`,
  `manage-backup-place`, `restore-backup`. Widgets `backup-places`,
  `backup-runs`, `restore-overlay`. React Query only inside `model/use-*`.
- **HTTP** stays in `shared/api/http`: added `uploadRaw` (raw `.mbk` body) and
  `downloadBlob` (authed binary) there — the only new transport. The download
  file name comes from the run (Content-Disposition is not CORS-exposed).
- **Secrets are write-only**: passphrase, bot token, OAuth client id/secret are
  set through the UI and never read back; the screen shows only presence/status.
- **Maintenance overlay**: a 503 `MAINTENANCE` from any request flips a shared
  `maintenance.store`; a started restore (202) flips it at once. `restore-overlay`
  (app-wide) then owns the screen — polls restore status, and on finish (or the
  401 when sessions end) sends the user to sign in again. The 401 auto-redirect
  is suppressed while restoring so that message is not lost.
- **Unreadable passphrase** (`passphraseStatus: 'unreadable'`) is a first-class
  state: shown plainly, fixed by typing a new passphrase.

## Consequences
- The passphrase/secrets live only server-side; losing them is unrecoverable
  (ADR 0051), and the UI says so.
- One new dependency-free transport path in `http.ts`; no new npm packages.
