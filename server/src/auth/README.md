# auth

Login and the current-user projection. See ADR 0005.

## Exposes (HTTP)

- `POST /auth/login` `{ email, password }` → `{ accessToken, user }`.
  argon2-verifies the password, rejects `isActive=false` with 401, sets
  `lastLoginAt`, signs an HS256 token. `@Public()`.
- `GET /auth/me` → `{ id, email, profile, roles: string[], permissions: string[] }`.
  Requires a valid token (no specific permission).

`user` in both responses is the `MeView` shape.

## Decisions

- **Access token only, default 12h** (`JWT_EXPIRES_IN`), no refresh token — one
  shift, re-login on expiry (ADR 0005).
- Token payload is `{ sub, email }` only. Permissions are resolved per request
  by `PermissionsGuard`, so revokes apply immediately.
- `JwtModule` is registered `global: true` here so the global guards can inject
  `JwtService`.

## Must never

- Put permissions or roles inside the JWT.
- Return `passwordHash`.
- Touch another module's repository — it injects `AccessService` for the
  effective permission set.
