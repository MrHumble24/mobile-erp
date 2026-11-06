# server — Malika Bazaar ERP/POS API

NestJS 11 + Prisma 7 (Postgres). Module anatomy and rules: `.agent/rules/`.

## Setup

```bash
pnpm install
cp .env.example .env   # then edit secrets — never commit .env
pnpm prisma generate
```

## Environment variables

| Var                       | Purpose                                             |
|---------------------------|-----------------------------------------------------|
| `PORT`                    | HTTP port (default 3000)                            |
| `DATABASE_URL`            | Postgres connection string                          |
| `JWT_EXPIRES_IN`          | Access-token lifetime, default `12h` (ADR 0005)     |
| `BOOTSTRAP_ADMIN_EMAIL`   | First-admin email, used only by `bootstrap:admin`   |
| `BOOTSTRAP_ADMIN_PASSWORD`| First-admin password                                |
| `UPLOADS_DIR`             | Where product pictures and company logos are stored (default `./uploads`, git-ignored). **On Railway point this at a mounted volume** (ADR 0031). |
| `DATA_DIR`                | Server-only state outside the DB: the secrets **master key**, restore staging and the restore **recovery markers** (default `./data`, git-ignored, owner-only). **On Railway: a mounted volume, or set `APP_MASTER_KEY`** (ADR 0051). |
| `APP_MASTER_KEY`          | Overrides `DATA_DIR/master.key`: hex, or base64 that round-trips, exactly 32 bytes. Seals all secrets (backup passphrase, provider tokens). Lose it = secrets unrecoverable. |
| `BACKUPS_DIR`             | Where encrypted `*.mbk` backups are written (default `./backups`, git-ignored, never served over HTTP). On Railway use a mounted volume for an on-server copy. |
| `BACKUP_PASSPHRASE`       | Fallback backup passphrase. Prefer setting it in-app (Settings → Backups, stored encrypted); env is used only when no readable in-app passphrase is set. Lose it = every backup unrecoverable. |
| `BACKUP_MAX_PAYLOAD_BYTES`| Largest backup payload (dump + uploads) before encryption (default 32 GiB, well under the AES-GCM limit); a bigger payload is refused with `BACKUP_TOO_LARGE`. |
| `BACKUP_MAX_UPLOAD_BYTES` | Largest restore upload accepted (default 2 GiB). |
| `PG_BIN_DIR`              | Optional directory holding `pg_dump`/`pg_restore` when they are not on `PATH`. |
| `PUBLIC_URL`              | The server's own public origin, used for the OAuth callback address (ADR 0056). On Railway set it to the app's URL; in dev it defaults to `http://localhost:<PORT>`. |
| `TELEGRAM_BOT_TOKEN`      | Fallback Telegram bot token for backups and notifications. |
| `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` | Fallback Google OAuth client for the Drive place (also set in-app). |
| `MICROSOFT_OAUTH_CLIENT_ID` / `_SECRET` | Fallback Microsoft OAuth client for the OneDrive place (also set in-app). |

## First-boot setup & locked-out recovery

- **First-boot onboarding**: On a fresh install with zero users, the server generates a one-time setup code, prints it to the console log, and saves it to `<DATA_DIR>/setup-code.txt`. The web client detects `needsSetup: true` from `GET /setup/status` and presents the onboarding wizard. Completing setup provisions the owner and first branch, unlinks the setup code file, and blocks future setup calls (409 Conflict).
- **Locked-out owner recovery**: If an administrator is locked out or loses credentials, run `pnpm bootstrap:admin` on the host to create or restore the administrative account from `BOOTSTRAP_ADMIN_*` variables.

## First-run sequence (order matters)

```bash
pnpm prisma migrate dev        # 1. apply schema
pnpm prisma db seed            # 2. seed lookups, permissions, roles (seed.sql)
pnpm bootstrap:admin           # 3. create the first ADMIN user (idempotent)
pnpm ref:import                # 4. load the device-lookup reference lists
```

`bootstrap:admin` does nothing once any user exists, and requires the `ADMIN`
role from step 2 to be present.

## Device-lookup reference lists (`pnpm ref:import`)

Loads the free code-lookup lists from `docs/reference/device-lists/` into
`ref_apple_box_codes` + `ref_imei_tacs`, **replacing** their contents.
Idempotent and safe on every deploy: two runs leave the same row counts. It
does not touch learned links (`ref_model_links`). The data is too big for a
migration, so **on Railway run `pnpm ref:import` once after each deploy** (after
`prisma migrate deploy`), from the `server/` directory. Only the exact files in
ADR 0031 are read; the Samsung colour/memory and picture files are skipped.

**Attribution.** The Apple box-code lists come from **The Apple Wiki**
(`theapplewiki.com`) under **CC BY-SA**; it must be credited. The lookup answer
carries this in `source` ({ name, license }). The IMEI TAC list is from
`github.com/MoazEb/tac-database` (MIT).

## Backups & restore (ADR 0051)

Managed in-app (Settings → Backups): scheduled or manual, encrypted `*.mbk`
files holding the whole database **and** the uploads, sent to storage providers
(server disk now; Telegram / Drive / OneDrive follow). Permissions `backup.read`
/ `backup.manage` / `backup.restore` (owner only by default).

**Run one instance only.** The maintenance switch and the restore recovery
markers are per-process; a restore assumes it is the single writer (ADR 0051).

**If a restore needs manual recovery.** A restore rolls itself back on failure;
only if that rollback also fails does the server stay in maintenance with a
marker in `DATA_DIR`. Restore the latest safety `.mbk` by hand (open it, then
`pg_restore` the dump and swap the uploads), then run
`pnpm tsx scripts/clear-recovery.ts` and restart.

- **Deploy needs.** `pg_dump` and `pg_restore` must be on the server, a major
  version **≥** the managed Postgres (a backup refuses an older client). Railway
  gets them from `server/nixpacks.toml` (`postgresql_17`); elsewhere install the
  Postgres client or set `PG_BIN_DIR`.
- **Keep safe forever:** the backup passphrase **and** the master key
  (`DATA_DIR/master.key` or `APP_MASTER_KEY`). Both are needed to open a backup
  on a new server. The app never shows either again.
- **Open a backup by hand** (no app, no database — the escape hatch):

  ```bash
  BACKUP_PASSPHRASE=... pnpm tsx scripts/open-backup.ts path/to/backup.mbk ./out
  # → ./out/database.dump  (pg_restore --clean --if-exists -d <db> ./out/database.dump)
  # → ./out/uploads.tar    (tar -xf into UPLOADS_DIR)
  ```

  The passphrase is the one set in-app (or `BACKUP_PASSPHRASE`); the master key is
  not needed here (the file carries its own salt). Restoring onto a brand-new
  server is: create the database, run the two commands above, then
  `pnpm prisma migrate deploy`.

### Storage places (Telegram, Google Drive, OneDrive — ADR 0056)

Off-machine copies, set up in-app (Settings → Backups → Places). LOCAL is always
on; the others are off until set up and tested. Secrets are set through
write-only routes (env fallback: `TELEGRAM_BOT_TOKEN`, `GOOGLE_OAUTH_CLIENT_ID`/
`_SECRET`, `MICROSOFT_OAUTH_CLIENT_ID`/`_SECRET`). OAuth needs `PUBLIC_URL` set to
the server's own public origin (the callback host); in dev it is `http://localhost:<PORT>`.

- **Telegram.** In Telegram, create a **new private channel or chat** for backups
  (not the staff alert group — the app refuses a chat that equals a shop alert
  chat). Add your bot to it and make it an admin. Find the chat id (e.g. forward a
  message to `@userinfobot`, or `getUpdates`). In the app set the bot token and the
  chat id, then **Test**. Parts stay in the chat (no delete).
- **Google Drive.** Google Cloud Console → **APIs & Services**. Enable the
  **Google Drive API**. **OAuth consent screen** → External, add yourself as a
  test user. **Credentials → Create OAuth client ID → Web application**. Under
  *Authorized redirect URIs* paste the address shown by
  `GET /backups/oauth/GOOGLE_DRIVE/redirect-uri` (it is `PUBLIC_URL` +
  `/backups/oauth/GOOGLE_DRIVE/callback`). Scope is `drive.file` (app-made files
  only). Put the client id + secret in the app, then **Connect**.
- **OneDrive.** Azure Portal → **App registrations → New registration**
  (accounts of your type). **Authentication → Add a platform → Web**, redirect URI
  = the address from `GET /backups/oauth/ONEDRIVE/redirect-uri`. **Certificates &
  secrets** → new client secret. **API permissions** → Microsoft Graph delegated
  `Files.ReadWrite.AppFolder` + `offline_access`. Put the client id + secret in
  the app, then **Connect**. (Microsoft rotates the refresh token on each refresh;
  the app seals the new one automatically, so OneDrive stays connected.)

## Run & test

```bash
pnpm start:dev     # watch mode
pnpm lint          # eslint (max 300 lines/file)
pnpm build         # nest build
pnpm test          # jest unit tests
```

## Auth model

Global `ThrottlerGuard` → `JwtAuthGuard` → `PermissionsGuard` protect every
route; opt out with `@Public()`. Protected routes declare
`@RequirePermissions('<resource>.<action>')`. Permission codes live in
`prisma/seed.sql` and the role matrix there. Requests run through `helmet` with
a 1 MB JSON body limit. **CORS** is driven by `CORS_ORIGINS` (comma-separated browser origins): unset means the Vite dev origins on
port 5173 outside production and nothing in production, where the client is served same-origin
behind the LAN proxy, so no cross-origin access is expected. See
`src/auth/README.md`, `src/access/README.md`, `src/common/README.md`, ADR 0005.

## Dev users

After `bootstrap:admin`, create staff accounts through the API as the admin (`POST /users` with
`roleCodes: ["CASHIER"]` / `["QC"]`) and keep their credentials in `.env` under `SEED_CASHIER_*` and
`SEED_QC_*` so other tools (client dev, Gemini handoffs) can log in. `.env` is git-ignored.
