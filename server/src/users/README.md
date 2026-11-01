# users

User accounts, profiles, and their role/permission assignments.

## HTTP (all require `user.manage`)

- `GET /users` → `UserView[]`
- `GET /users/:id` → `UserView` (404 if missing)
- `POST /users` `{ email, password, profile{ firstName, lastName?, phone?, telegramHandle?, avatarUrl?, locale? }, roleCodes[] }` → `UserView`
- `PATCH /users/:id` `{ profile?, isActive? }` → `UserView`
- `PUT /users/:id/roles` `{ roleCodes[] }` → `UserView` (replaces the set)
- `PUT /users/:id/permissions` `{ overrides: [{ permissionCode, granted, reason? }] }` → `UserView`
  (replaces all per-user overrides)

`UserView` = `{ id, email, isActive, lastLoginAt, createdAt, profile, roles: string[] }`.

## Decisions

- Passwords are argon2-hashed in the service; `passwordHash` is never selected
  outward (see `userSelect` in the repository).
- Role and permission codes are validated against `AccessService` before write;
  this module imports `AccessModule` and uses its **service**, never its
  repository or tables.

## Must never

- Return `passwordHash`.
- Edit the role→permission matrix (that is `access`).
