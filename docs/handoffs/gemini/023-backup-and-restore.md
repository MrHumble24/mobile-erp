# 023 — Backup and restore, with storage providers (server and website)

Status: building · Owner: Claude Opus 4.8 (`opus48` agent), orchestrated by Claude · Asked by the user on 2026-11-06; started the same day on the user's word. Parts 1 and 2 first; 3, 4 and 5 after Claude has checked them.

## Why
The shop's whole business lives in one database and one folder of pictures. The PRD already asks
for "daily automated encrypted database backups" (section "Security & Backups"). The user wants
the full feature: backups made on a schedule and by hand, sent to several places (Google Drive,
Microsoft OneDrive, Telegram, others later), restore from a backup, and all of it set up from the
Settings page. Storage places must be an adapter pattern: a new place is a new file, nothing else
changes.

A backup holds every customer, every debt and every password hash, and a restore replaces
everything. This is the most dangerous feature in the system. The safety rules below are part of
the task, not extras.

## Decided (Claude's defaults, 2026-11-06; the user can change any of them)
| Question | Decision |
|---|---|
| What is in a backup | The whole database and the uploads folder (product pictures), in one file, with a manifest. One backup covers the whole company, all branches. |
| Encryption | Always. The file is encrypted on the server before it goes anywhere. A backup that cannot be encrypted is not made. |
| The encryption key | A passphrase the owner types once in Settings (the user wants configuration in the app, not in env files). It is kept in the encrypted secrets store and never shown again; the old env value `BACKUP_PASSPHRASE` still works as a fallback. Each backup's key is derived from the passphrase. Without the passphrase a backup cannot be opened, so the owner must remember it or keep it somewhere safe: it is what lets them restore onto a brand new server. |
| Provider logins and tokens | Stored in the same encrypted secrets store. Its master key is made by the server on first boot and kept in a file in the data folder, not in the database (an env value may override it). The API never returns a secret; it only says "set" or "connected". |
| First providers | Server disk, Telegram, Google Drive, Microsoft OneDrive. S3-style storage later, as one more adapter. |
| When | By hand, and on a schedule: every day at a chosen time. |
| How many are kept | The last N per place (default 14). Older ones are deleted where the place allows deleting. |
| Who | New permissions `backup.read`, `backup.manage`, `backup.restore`. Owner only by default. |
| Restore | All or nothing. A safety backup is made first. The owner types the shop's name and their password to confirm. Everyone is signed out afterwards. |
| Not in the first version | Restoring one table or one branch; backups per branch; a backup the customer can read without the system. |

## What exists already (ADR 0010)
Shell scripts in `server/scripts/`: `backup-db.sh`, `restore-db.sh`, `verify-backup.sh`. They dump
the database with `pg_dump`, encrypt with `openssl` and the passphrase in `BACKUP_PASSPHRASE`, and
are run by hand or by cron on the shop's PC. They do not include the pictures, send nothing
anywhere, and have no screen. This task moves the job into the app. The new ADR supersedes 0010;
the scripts are removed or rewritten for the new file format, and a small command-line tool must
remain that opens a backup when the app itself is gone.

## Scope
`server/**`, `client/**`, docs, and the deploy files needed to have `pg_dump` / `pg_restore` on
the server. Not `mobile/**`.

=== MESSAGE ===
Build backup and restore on the server and the website. Do not ask questions; where something is open, take the simplest safe option and write it in the ADR. Build the parts in order and commit after each; part 1 must be useful alone.

First:
- Read `CLAUDE.md` and every file in `.agent/rules/`. They are binding. Read this whole file, including "Decided" and "What exists already" above, `server/scripts/*.sh`, and ADRs 0010, 0023, 0031, 0045 and the READMEs of `server/src/settings`, `telegram`, `stores`, `access`, `auth`, `sync`.
- Worktree: `git worktree add .worktrees/<agent>-backup -b agent/<agent>/backup main`. Never commit to `main`, never push.
- Your own database: `createdb mobile_erp_backup && pg_dump mobile_erp_main | psql -q mobile_erp_backup`; copy `server/.env` from the main checkout and change only the database name. **Every restore test runs against a throwaway database you created for it. Never restore into `mobile_erp_main`, `mobile_erp` or any database you did not create in this task.**
- Your own servers on your own ports. Never stop a process you did not start.
- No new dependency for the provider APIs: Google Drive, Microsoft Graph and Telegram are plain HTTPS; use Node's `fetch`. A tar or zip library, if Node has no built-in way, is the one dependency you may add; say which and why in the ADR.

PART 1 — make a backup, keep it on the server, list it, download it
0. A small secrets module first (`server/src/secrets/`): on first use the server makes a random master key and writes it to a file in the data folder (`DATA_DIR`, default `./data`, owner-only file permissions; env `APP_MASTER_KEY` may override). It stores named secrets encrypted with AES-256-GCM in one table; a secret can be set, asked "is it set", and read only by server code. No route ever returns one. Keep it small and general: the first-boot setup task (handoff 024) will reuse it as it is.
A. Module `server/src/backups/` (controller, service, repository; split by responsibility, files ≤300 lines):
- The file: a database dump made by `pg_dump` (custom format), the uploads folder, and `manifest.json` (format version, app version, the name of the last applied migration, creation time, size and SHA-256 of each part). Packed into one archive, then encrypted with AES-256-GCM, streamed, with a key derived (scrypt, a fresh salt per backup, the salt and parameters in the file's header) from the backup passphrase: the secret `backup.passphrase`, set through a write-only route, with env `BACKUP_PASSPHRASE` as the fallback. No passphrase, no backup (never the whole file in memory). File name `backup-<yyyy-mm-dd>-<hhmm>-<short id>.mbk`.
- `pg_dump` and `pg_restore` are started with `spawn` and an argument array, never through a shell, never with text built from input. The password goes in the child's environment, never on the command line. If the program is missing or its version is older than the server's, the backup fails with a clear message. Add what the deploy needs so both programs exist on the server (the project deploys to Railway with Nixpacks; add the config file and say in the Result what you added).
- Tables (new schema file; lookups, no enums): company-wide backup settings (schedule on/off, time of day, how many to keep); backup runs (who or "schedule", start, end, size, checksum, file name, status, error); one row per place a run was sent to (status, the place's own reference to the file, error). Statuses are lookup tables.
- One backup at a time: a second request while one runs is refused with `BACKUP_RUNNING`. A run that died with the server is marked failed at start-up.
B. The adapter. One interface, for example:
  ```ts
  interface BackupStorage {
    readonly code: string                       // 'LOCAL', 'TELEGRAM', 'GOOGLE_DRIVE', 'ONEDRIVE'
    readonly capabilities: { list: boolean; download: boolean; delete: boolean; maxPartBytes: number | null }
    validate(config: unknown, secret: unknown): Promise<void>     // can we really reach it
    upload(file: BackupFile, dest: Destination): Promise<RemoteRef>
    download(ref: RemoteRef, dest: Destination): Promise<Readable>
    remove(ref: RemoteRef, dest: Destination): Promise<void>
  }
  ```
  Adapters are registered through one Nest DI token; the service never names a provider. Adding a provider must be: one new file, one line in the module, one row in the providers lookup. No `switch` on the provider code anywhere.
- The `LOCAL` adapter: a folder on the server (`BACKUPS_DIR`, outside the uploads folder and never served over HTTP).
C. Routes (all signed in; `backup.read` to look, `backup.manage` to act): list runs; start a backup; download a backup file (streamed, the encrypted file as it is); delete a backup; read and change the settings. The schedule runs the same code as the button. After each run the retention rule deletes the oldest beyond N, per place.
D. A Telegram message to the shop when a scheduled backup fails (never the file, never a secret).

PART 2 — restore
- Sources: a backup in the list, or an uploaded `.mbk` file (size limit; streamed to disk, not memory).
- Before anything is changed: decrypt and check the checksums; read the manifest; refuse if the backup's last migration is not one this server knows (`BACKUP_FROM_NEWER_VERSION`).
- Then, in this order: make a safety backup (LOCAL) and stop if it fails; switch the server to maintenance (every route except health and the restore's own status answers 503 `MAINTENANCE`; scheduled jobs do nothing); run `pg_restore --clean --if-exists --single-transaction` so the database is either fully the backup or untouched; run the pending migrations; replace the uploads folder by extracting to a new folder and swapping it in; end every session (all tokens made before the restore stop working); leave maintenance. If any step fails the database is as it was, the uploads folder is as it was, and maintenance ends with the error recorded.
- Extracting: refuse any entry with an absolute path, `..`, a link, or a name outside the expected set. Never trust a file name from inside the archive.
- `POST /backups/:id/restore` and `POST /backups/restore-upload` need `backup.restore`, the shop's name typed exactly, and the caller's password checked again. Restore runs are recorded (who, when, from which backup, result).
- The restore must be proven in a test that uses a real throwaway database (its own command, for example `pnpm test:restore`, so the normal `pnpm test` stays fast and needs no database; the test creates and drops its own databases with a random name): make data, back up, change the data, restore, and the data is the first data again; and a restore that is made to fail half-way leaves the changed data untouched.

PART 3 — Telegram
- Sends the encrypted file with the bot (`TELEGRAM_BOT_TOKEN` already exists) to a chat chosen in Settings. This must be a private chat or channel for backups, not the shop's staff group; say so on the screen.
- A bot can send files up to 50 MB and fetch back only up to 20 MB. So the adapter cuts the file into parts no larger than 19 MB, sends them in order with a caption that names the backup and the part, and can put them together again. `capabilities.delete` is false: old backups stay in the chat; say so on the screen.

PART 4 — Google Drive and Microsoft OneDrive
- Each is OAuth 2 with a refresh token. The app's client id and secret come from the environment (`GOOGLE_OAUTH_CLIENT_ID` / `_SECRET`, `MICROSOFT_OAUTH_CLIENT_ID` / `_SECRET`); when they are missing, that provider is shown as "not available on this server" and cannot be chosen.
- Ask for the smallest access: Google `drive.file` (only files this app made); Microsoft `Files.ReadWrite.AppFolder offline_access` (only the app's own folder).
- The connect flow: Settings → "Connect" → the provider's consent page → back to one callback route. The `state` value is random, tied to the signed-in user, single use and short-lived; a callback with a wrong or used `state` is refused. The refresh token is stored encrypted and never returned.
- Uploads use the provider's resumable upload (Drive) or upload session (Graph), in chunks, with a retry for a dropped chunk. A revoked or expired login marks the place "needs reconnecting" and the run as partly failed; it does not stop the other places.
- Write `docs/` instructions (in the package README) for creating the two OAuth apps: where to click, which redirect address, which scopes.

PART 5 — the website
- Settings → "Backups" (permission `backup.read`): the key status ("set" / "missing: backups are off"); the schedule and how many to keep; the list of places with status, last success, last error, and Connect / Test / Disconnect; "Back up now"; the list of backups (date, size, who, where it went, status) with Download, Delete and Restore.
- Restore is a separate, clearly red dialog: what will be replaced, the date of the backup, the name to type, the password. While a restore runs the whole site shows a "restoring, please wait" screen and comes back by itself.
- Uzbek and English text. With the React Compiler on, read form values with `useWatch`, never `form.watch`.

SAFETY — applies to every part
- No secret (key, token, password, OAuth code) is ever logged, returned by a route, put in a URL, or sent to Telegram. A test walks every backup route's answer for keys named like `token`, `secret`, `key`, `password`.
- Every route is behind a permission. A cashier gets 403 on all of them. Branches: backups are company-wide; no `X-Store-Id` logic here, and a user of one store with `backup.manage` still backs up everything, so only the owner has these permissions by default.
- Downloads and restores are rate limited with the installed `@nestjs/throttler`.
- A provider address is never taken from user input: the adapters call fixed hosts only.

Checks:
- `cd server && pnpm build && pnpm test && pnpm lint`; `cd client && pnpm test && pnpm lint && pnpm build`.
- Tests next to the files: encrypt then decrypt gives the same bytes; a changed byte fails the checksum; a wrong key fails cleanly; the archive checks; each adapter against a fake HTTP server (parts, retry, revoked login); retention; one-at-a-time; the two restore tests in Part 2; the permission and secret-leak tests.
- A real walk-through on your own servers, written with what you saw: back up; download; change data; restore; data is back; connect Telegram to a test chat and see the parts arrive. For Google and Microsoft say plainly whether you had real OAuth apps to test with; if not, write "not seen" and what was tested with the fake server.
- A command-line tool (`server/scripts/`, run with `tsx`) that decrypts and unpacks a backup file given the passphrase, with no database and no running app; the old `.sh` scripts are removed or rewritten to the new format, never left behind doing the old thing.
- Docs: `docs/decisions/0051-backup-and-restore.md` (it supersedes 0010; mark 0010 as superseded) and `0052-client-backups.md` (≤40 lines each), module and slice READMEs, the server package README (environment variables, deploy needs, how to restore onto a new server by hand when the app itself is gone).
- `graphify update .` in `server/`, `client/` and the root. Add files by path. Do not merge, do not push.

Do not: edit `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`; add an enum; store or return a secret in plain text; restore into a database you did not create.

Fill the Result section below and set Status to done. Report only what you ran and saw yourself; if you did not see it, write "not seen".
=== END ===

## Result (builder fills)
Scope done by `opus48`: step 0 (secrets), PART 1, PART 2, SAFETY. PART 3
(Telegram), PART 4 (Drive/OneDrive) and PART 5 (website) are left for later
builders — the adapter interface and routes are built so each needs no change to
this code (one new file + one line in `STORAGE_ADAPTERS` + one `backup_providers`
row).

- Branch / commits, per part: branch `agent/opus48/backup` (worktree, not pushed).
  - secrets module: `0c02f62`
  - PART 1 (backups): `945f9cf`
  - PART 2 (restore): `9f27946`
- Deploy changes: `server/nixpacks.toml` adds `postgresql_17` (keeps Nixpacks'
  auto packages via `"..."`) so `pg_dump`/`pg_restore` land on PATH on Railway.
  Client major must be ≥ the managed Postgres major (a backup refuses an older
  client); `PG_BIN_DIR` overrides the location.
- New environment variables: `DATA_DIR` (server-only state: master key + session
  cutoff; default `./data`), `APP_MASTER_KEY` (override the master key file, 32
  bytes base64/hex), `BACKUPS_DIR` (where `.mbk` files go, default `./backups`),
  `PG_BIN_DIR` (optional pg tools dir), `BACKUP_MAX_UPLOAD_BYTES` (restore-upload
  cap, default 2 GiB). `BACKUP_PASSPHRASE` kept as a fallback (now in-app too).
  Removed the old script-only `BACKUP_DIR` / `BACKUP_RETENTION_DAYS`.
- Server build/tests/lint: `pnpm build` clean; `pnpm test` 97 suites/567 tests →
  **106 suites / 598 tests**, ~1.4 s, no DB; `pnpm lint` 0 errors (3 pre-existing
  warnings, files I did not touch). Real-DB restore test `pnpm test:restore`
  (own throwaway DBs): both cases PASS. Website: not in my scope (PART 5).
- Walk-through (ran on my own API, ports 3140/3141, own DBs — all **seen**):
  make a backup (SUCCESS, 370 KB encrypted, LOCAL target); file header is `MBK1`
  + no plaintext table names; `scripts/open-backup.ts` decrypts + unpacks, dump
  is a valid custom archive (71 tables), **wrong passphrase fails cleanly**;
  download returns the exact encrypted bytes; passphrase route is write-only
  (204, empty body), settings expose only `passphraseSet`; secret-leak scan over
  every response = none; **cashier gets 403 on all 8 routes**. Restore: wrong
  shop name / wrong password → 403 (nothing touched); a real restore reverted
  drifted data, made a safety backup, cycled maintenance, **ended every session**
  (pre-restore token → 401), wrote a SUCCESS audit row; login resumes after the
  1-second cutoff. Restore round-trip + fail-half-way atomicity: seen via
  `pnpm test:restore`.
- Google Drive and OneDrive: not in my scope (PART 4) — not built, not tested.
- Decisions taken: (1) added `tar` (Node has no archive format; used once, with a
  safe-extract entry filter). (2) `.mbk` = encrypted tar of manifest + pg_dump
  (custom) + `uploads.tar`; AES-256-GCM + scrypt, streamed. (3) Secrets store is a
  general module reused by the passphrase; master key in `DATA_DIR`, never in the
  DB. (4) Sessions end via a DATA_DIR cutoff file (survives the restore) checked
  in the JWT guard — one int compare/request; cutoff is `now+1s`, so a login in
  the same second as a restore is rejected (<1 s window, errs safe). (5) A restore
  replaces the DB including its own RUNNING audit row, so the outcome is
  re-recorded by upsert, best-effort — a bookkeeping failure never fails an
  already-done restore. (6) `restore-upload` takes the raw body (octet-stream) +
  `x-restore-*` headers, streamed to disk — no multer dependency. (7) `POST
  /backups` awaits the run (small shop DB; website polls the list).
- Not done / skipped / failed: PART 3/4/5 (other builders). I did not run a
  destructive restore through the shared dev API; live restores I saw ran against
  throwaway copies on my own ports.

## Fix round (2026-11-06, commits `a03a12f`, `4579b71`)
Addressed all 13 review items (A1-A11, T1-T3). Gate green (`pnpm build` + `pnpm
test` 606/606 + `pnpm lint` 0 errors) and `pnpm test:restore` passes all four
scenarios (round-trip, fail-half-way, rollback-on-swap-fail, rollback-on-migrate-
fail). Highlights seen live on my own ports / DBs:
- A1 session cutoff moved to the DB (`session_gate`), fail-closed; survives
  restart + redeploy. (unit-tested)
- A2 restore is all-or-nothing after pg_restore: a later failure rolls the DB
  **and** uploads back to the safety backup and leaves maintenance; manual
  recovery only if the rollback also fails. (e2e scenarios 3 & 4)
- T1 a sealed passphrase unreadable with a fresh DATA_DIR now gives **400
  BACKUP_PASSPHRASE_UNREADABLE** (was 500); `settings.passphraseStatus:
  set|missing|unreadable`; re-setting overwrites. (seen on port 3140)
- T2 reconcile fixes the list after a restore (safety backup appears, the
  restored-from run becomes SUCCESS). T3 status returns `{restoring,
  needsManualRecovery, last}`. A7 upload is two steps (`POST /uploads` returns
  `{uploadId, migrationName…}`; unknown id → 404). (seen on port 3140)
- A3/A4 header validated + AAD-bound, payload capped; A6 pg stderr server-side
  only; A8 staging under DATA_DIR; A9/A10 master.key exclusive-create + strict
  base64; A11 schedule marks only after a real attempt; A5 persisted
  restore/manual-recovery markers + `scripts/clear-recovery.ts`.
The earlier "safety-row wiped by restore" gap is now handled by T2 reconcile.
Still single-instance only (the maintenance switch + markers are in-process;
documented in ADR 0051 and the README).

## PART 3 + PART 4 (2026-11-06, commit `b0fd859`)
Storage providers (ADR 0056). Gate green (`pnpm build` + `pnpm test` 638/638 +
`pnpm lint` 0 errors) and `pnpm test:restore` still passes all four scenarios.
Two fold-ins done: run view gains `downloadable` + `partlyFailed` (a LOCAL target
whose file is gone reads FAILED "file missing"); `backups.repository.ts` split
(restore audit → `restore.repository.ts`).
- PART 3 **Telegram**: file sent in ≤19 MB parts, joined + checksum-verified on
  download; `delete:false`; backup chat ≠ a shop alert chat.
- PART 4 **Drive** (`drive.file`) + **OneDrive** (`Files.ReadWrite.AppFolder`):
  OAuth 2 + PKCE, resumable/session chunked upload with chunk retry, revoked
  login → NEEDS_RECONNECT.
- Routes: `GET /backups/places`; `PUT /places/:code/enabled|settings|secret`
  (write-only); `POST /places/:code/test|disconnect`; OAuth `GET
  /backups/oauth/:code/start|callback|redirect-uri`.
- Seen live on my own server/DB: places list (LOCAL locked+on; the rest off,
  not-configured, with capabilities incl Telegram's 19 MB part cap); redirect-uri
  is the **server** origin; an untrusted `returnTo` → 400 `OAUTH_RETURN_URL_
  INVALID`; LOCAL off → 403; enable a not-connected place → 409; set bot token →
  204; set a chat → `connected:true`; **no secret in any answer**.
- Tests (fast, no network, fake HTTP servers): Telegram 45 MB split/join byte-
  for-byte, dropped chunk retried, revoked login, OAuth state + open-redirect
  rules, partly-failed run with LOCAL intact, retention per place, restore from a
  remote-only backup.
- **Not seen with the real Telegram / Google / Microsoft services** — no outbound
  access from here; adapters were built to the documented API shapes and tested
  against faithful fake servers. README has the Google/Microsoft app + Telegram
  chat setup steps. Microsoft refresh-token rotation is not persisted (occasional
  reconnect; documented). `secrets` public API (stable, small): `set(name,value)`,
  `isSet(name)`, `state(name)` → set|missing|unreadable, `read(name)` (server-only;
  throws on unreadable), `clear(name)`, plus `AppKeyService.getKey()`/`dataDir()`.

## Check by Claude
- Before merging: `security-auditor` on the whole diff, a restore tried by Claude on a throwaway
  database, and a look at one backup file to confirm it is unreadable without the key.
