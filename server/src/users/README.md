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
- **No privilege escalation** (enforced in the service using the caller's own
  effective set from `@CurrentUser()`):
  - A caller cannot change their **own** roles or permissions (403).
  - A caller may assign a role only when every permission that role grants is in
    the caller's effective set (403 otherwise). Applies to `POST /users` too.
  - A caller may `granted:true` a permission only if they hold it themselves;
    revokes (`granted:false`) are always allowed.

## Must never

- Return `passwordHash`.
- Edit the role→permission matrix (that is `access`).
- Let a `user.manage` holder grant more than they themselves hold.
