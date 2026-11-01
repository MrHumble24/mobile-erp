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

## First-run sequence (order matters)

```bash
pnpm prisma migrate dev        # 1. apply schema
pnpm prisma db seed            # 2. seed lookups, permissions, roles (seed.sql)
pnpm bootstrap:admin           # 3. create the first ADMIN user (idempotent)
```

`bootstrap:admin` does nothing once any user exists, and requires the `ADMIN`
role from step 2 to be present.

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
a 1 MB JSON body limit. **CORS is disabled**: the client is served same-origin
behind the LAN proxy, so no cross-origin access is expected. See
`src/auth/README.md`, `src/access/README.md`, `src/common/README.md`, ADR 0005.
