# 0005 — Auth: JWT shift token, permissions resolved per request

Date: 2026-11-01
Status: Accepted

## Context

Malika Bazaar runs single-shift POS sessions on shared devices. Wave 1 needs
authentication and authorization with no client/sync layer yet. RBAC is a
matrix (roles × permissions + per-user overrides, ADR 0003); permission checks
must reflect revokes immediately and never branch on a role name.

## Decision

- Stateless **access token only** — HS256, secret `JWT_SECRET`, expiry
  `JWT_EXPIRES_IN` (default `12h`, one shift). **No refresh token.** When the
  token expires the cashier logs in again.
- JWT payload is `{ sub, email }` only. Permissions are **not** in the token:
  `PermissionsGuard` loads the effective set fresh from the DB on every request,
  so a grant/revoke takes effect on the user's next call.
- Passwords hashed with **argon2**. Inactive users (`isActive=false`) are
  rejected at login with 401.
- Two global guards (`JwtAuthGuard` then `PermissionsGuard`) + a global
  `CostRedactionInterceptor`. Routes opt out with `@Public()`; protected routes
  declare `@RequirePermissions('<resource>.<action>')`.
- First admin is created by `pnpm bootstrap:admin` from env, idempotently.

## Consequences

- Fresh per-request permission load costs one small query per authenticated
  request; acceptable at this scale and removes token-staleness bugs.
- No server-side logout/blacklist; a leaked token is valid until expiry. The
  12h window bounds the risk.
- **Offline login is deferred** to the client/sync wave (Wave 3): the client
  will cache a verifier for offline shifts; the server contract is unchanged.
