# Security audit — 2026-11-02 (pre-release, main @ 666ef53)

Run by the read-only `security-auditor` agent over `server/`, `client/`, `docs/`.
Fixes: backend package on branch `agent/backend/security-fixes`, CSV fix on main.

SUMMARY: 1 critical, 1 high, 5 medium, 2 low

## Findings (most severe first)

1. **[CRITICAL] `role.manage` holder can grant any permission to any role**
   where: `server/src/access/access.service.ts` `setRolePermissions` (route `access.controller.ts`)
   why: no "caller may only hand out permissions they hold" check and no `isSystem` guard, unlike `UsersService.assertCanGrantPermissions`.
   fix: backend — subset rule + reject editing system roles.

2. **[HIGH] `user.manage` holder can reset any account's password**
   where: `server/src/users/users.service.ts` `resetPassword`
   why: never compares target privileges to the caller's; no session invalidation.
   fix: backend — refuse when target's effective permissions are not a subset of caller's; `tokenVersion` deferred.

3. **[MEDIUM] Last admin can be locked out** — `users.service.ts` `update`/`setRoles`. fix: backend — protect the last active ADMIN.

4. **[MEDIUM] Report cost aliases escape `CostRedactionInterceptor`** — `cogs` (breakdown, trend), `inStockLandedValue`/`landedValue` (inventory), `avgAcquisitionCost`/`avgLandedCost` (model pricing); `common/lib/redact.ts` matches exact names only. Not reachable with seeded roles. fix: backend — cover the aliases.

5. **[MEDIUM] JSONB `specs` not schema-validated** — `shipments/dto/register-devices.dto.ts`, `devices/dto/update-device.dto.ts` accept any object. fix: backend — shape validator.

6. **[MEDIUM] CSV formula injection** — `client/src/shared/lib/csv.ts` quoted only `"`, `;`, newline. fix: frontend — apostrophe-prefix cells starting with `= + - @ \t \r` (done on main).

7. **[MEDIUM] Sync changes feed leaks partner balances to `device.read`** — `sync/sync-changes.service.ts`. fix: backend — partners block only with `partner.read`.

8. **[LOW] `multer` high advisory (transitive, unreachable)** — no upload routes; `pnpm audit --prod` in `server/`. fix: pnpm override / next Nest bump.

9. **[LOW] JWT + profile persisted in `localStorage`** — `client/src/features/auth/model/auth.store.ts`. Accepted for a local-first POS; highest-value XSS target. Revisit with offline-sync ADR.

## Checked and clean
Authentication (argon2id, constant-time compare, live `isActive`, login throttle, HS256 pinned), data access (parameterised `Prisma.sql`, filter objects, `@Max(200)` page caps), offline sync push path (idempotency, version lock, per-mutation permission, rejected never persisted, no force path), secrets (`.env` never in history, placeholders only in `.env.example`), transport (helmet, CORS allow-list, 1 MB body cap), client env exposure, logging/PII, authorization decorators on every route, global `ValidationPipe` whitelist + forbidNonWhitelisted, IMEI regex, Decimal money.
