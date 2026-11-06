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
| `DATA_DIR`                | Runtime data directory for `master.key` and setup code (default `./data`, git-ignored). Mount as volume on Railway. |
| `MASTER_KEY`              | Optional 32-byte hex master key override (AES-256-GCM) |
| `JWT_SECRET`              | HS256 signing secret (required)                     |
| `JWT_EXPIRES_IN`          | Access-token lifetime fallback, default `12h` (ADR 0005) |
| `BOOTSTRAP_ADMIN_EMAIL`   | First-admin email, used only by `bootstrap:admin` recovery |
| `BOOTSTRAP_ADMIN_PASSWORD`| First-admin password for recovery                   |
| `UPLOADS_DIR`             | Where product pictures and company logos are stored (default `./uploads`, git-ignored). Mount as volume on Railway (ADR 0031). |

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
