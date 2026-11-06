# 0056 — Backup storage providers (Telegram, Google Drive, OneDrive)

Date: 2026-11-06
Status: Accepted (extends ADR 0051)

## Context
ADR 0051 made LOCAL the only place a backup could go, behind a `BackupStorage`
adapter. The shop wants off-machine copies — Telegram, Drive, OneDrive — managed
from the app (PART 3/4 of handoff 023).

## Decision
- **One destination per provider** (`LOCAL`, `TELEGRAM`, `GOOGLE_DRIVE`,
  `ONEDRIVE`). LOCAL is always on and cannot be switched off; every other place
  is off until set up and tested. A run **succeeds when LOCAL succeeded**; a
  failed remote place makes the run *partly failed* (per-target, plus
  `partlyFailed`/`downloadable` on the run view), never failed, and never stops
  the others. Retention runs per place where `capabilities.delete`.
- **Config lives in the app** (`backup_provider_configs`): on/off, non-secret
  settings (Telegram chat id; OAuth account, folder) and a status lookup
  (`OK`/`NEEDS_RECONNECT`/`ERROR`/`NEVER_USED`). Secrets — bot token, OAuth client
  id/secret/refresh token — live in the `secrets` store (write-only routes, env
  fallback except the refresh token); a route says only `set`/`missing`/`unreadable`.
- **Telegram** sends the file in ≤19 MB parts (bot upload 50 MB, fetch 20 MB),
  captioned "part i of n"; part file-ids + whole-file SHA-256 are the `remoteRef`;
  download streams the parts and verifies. `delete:false`; backup chat ≠ alert chat.
- **Drive / OneDrive** are OAuth 2 + PKCE, smallest scopes (`drive.file`,
  `Files.ReadWrite.AppFolder offline_access`); resumable/session chunked upload,
  a dropped chunk retried; a revoked login → `NEEDS_RECONNECT`. `state` is
  random, single-use, short-lived, bound to user + provider; the callback is
  public and refused on a bad/used/expired state. The return URL must be a
  trusted origin (`PUBLIC_URL` or a CORS origin), never raw (no open redirect).
- All calls go to **fixed hosts** with `fetch` (env-overridable only for tests),
  with timeouts; no new dependency.

## Consequences
- Download/restore try LOCAL first, then any downloadable remote, so a backup
  kept only on Drive still restores.
- Microsoft's rotated refresh token is sealed each time, so OneDrive stays
  connected. Every request has an AbortController timeout and each place's upload
  is bounded, so a stalled remote cannot hold the run lock. Tested with fakes.
