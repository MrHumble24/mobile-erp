# common

Cross-cutting HTTP plumbing. No business logic, no domain words.

## Exposes

- **Guards** (`guards/`), registered globally in `app.module.ts`:
  - `JwtAuthGuard` — verifies the HS256 bearer token, attaches `{ id, email }`
    to the request. Skips `@Public()` routes.
  - `PermissionsGuard` — loads the user's effective permission set fresh (via
    `AccessService`), attaches it to the request, and enforces
    `@RequirePermissions(...)`. Checks permission codes, never role names.
- **Decorators** (`decorators/`): `@Public()`, `@RequirePermissions(...)`,
  `@CurrentUser()`.
- **Filter** (`filters/http-exception.filter.ts`) — normalizes every error to
  `{ statusCode, message, error }`. Wired in `main.ts`.
- **Interceptor** (`interceptors/cost-redaction.interceptor.ts`) — strips
  `acquisitionCost`/`landedCost`/`landedCostSnapshot` unless the user holds
  `device.cost.view`, and `netProfit` unless they hold `sale.profit.view`.
  Default-deny when no user. Recurses only into plain objects/arrays
  (`lib/redact.ts`), leaving Date/Decimal leaves intact.
- **Types** (`types/authenticated-user.ts`): `AuthenticatedUser`.

## Must never

- Import a concrete repository or Prisma client (guards depend on
  `AccessService` only).
- Hold domain knowledge beyond the two redaction permission codes.
