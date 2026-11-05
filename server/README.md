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
