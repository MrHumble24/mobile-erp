## server/ — NestJS module anatomy (mandatory)

Each business capability is one module under `server/src/<module>/`:

```
<module>/
  <module>.module.ts      wiring only
  <module>.controller.ts  HTTP only: route, DTO validation, call one service method, return
  <module>.service.ts     business rules; no Prisma, no HTTP types
  <module>.repository.ts  all Prisma queries for this module; the only file that injects PrismaService
  dto/                    class-validator DTOs (input) and response shapes
  types/                  domain types & enums shared inside the module
  *.spec.ts               next to the file it tests
  README.md               when the module has > 3 files
```

- Controllers never contain `if` business logic; services never import `express`, `Request`, `Response`.
- Repositories return domain types, not raw Prisma rows leaking `select`/`include` shapes outward.
- Cross-module use = import the module and inject its **service**. Never inject another module's repository or reach into its folder.
- Cross-cutting code lives in `src/common/` (guards, pipes, filters, interceptors, decorators) and `src/config/`. Nothing business-specific goes there.
- Schema lives in `prisma/schema/<domain>.prisma` (rules: `database.md`); reference data in `prisma/seed.sql`.
- `src/generated/**` is Prisma output: never edit, never import from outside repositories and the prisma module.
- One controller = one REST resource. Second resource → second module.
