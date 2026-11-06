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
| `JWT_SECRET`              | HS256 signing secret (required)                     |
| `JWT_EXPIRES_IN`          | Access-token lifetime, default `12h` (ADR 0005)     |
| `BOOTSTRAP_ADMIN_EMAIL`   | First-admin email, used only by `bootstrap:admin`   |
| `BOOTSTRAP_ADMIN_PASSWORD`| First-admin password                                |
| `UPLOADS_DIR`             | Where product pictures are stored (default `./uploads`, git-ignored, created on start). **On Railway point this at a mounted volume** — a plain directory is wiped on every deploy and the pictures vanish (ADR 0031). |
| `DATA_DIR`                | Server-only state outside the DB: the secrets **master key** and the session cutoff file (default `./data`, git-ignored, owner-only). **On Railway: a mounted volume, or set `APP_MASTER_KEY`** — else the key is regenerated each deploy and every secret becomes unreadable (ADR 0051). |
| `APP_MASTER_KEY`          | Overrides `DATA_DIR/master.key`: base64 or hex, exactly 32 bytes. Seals all secrets (backup passphrase, provider tokens). Lose it = secrets unrecoverable. |
| `BACKUPS_DIR`             | Where encrypted `*.mbk` backups are written (default `./backups`, git-ignored, never served over HTTP). On Railway use a mounted volume for an on-server copy. |
| `BACKUP_PASSPHRASE`       | Fallback backup passphrase. Prefer setting it in-app (Settings → Backups, stored encrypted); env is used only when no in-app passphrase is set. Lose it = every backup unrecoverable. |
| `PG_BIN_DIR`              | Optional directory holding `pg_dump`/`pg_restore` when they are not on `PATH`. |

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
