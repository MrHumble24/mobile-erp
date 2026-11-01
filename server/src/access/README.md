# access

Owns the RBAC matrix: roles, permissions and the effective-permission math.

## Exposes

- `AccessService.getEffectivePermissions(userId): Promise<Set<string>>` —
  `(union of every role's permissions ∪ user grants) − user revokes`. A revoke
  always wins. Consumed by `PermissionsGuard`, `AuthService` and `UsersService`.
- `AccessService.listRoles()` / `listPermissions()` — used by `UsersService` to
  validate submitted codes.

## HTTP (all require `role.manage`)

- `GET /access/roles` → `RoleView[]` (`{ code, name, description, isSystem, permissionCodes }`)
- `GET /access/permissions` → `PermissionView[]`
- `POST /access/roles` `{ code, name, description? }` → `RoleView` (409 if exists)
- `PUT /access/roles/:code/permissions` `{ permissionCodes[] }` → `RoleView`
  (replaces the matrix row; 404 unknown role, 400 unknown permission)
- `DELETE /access/roles/:code` → 204 (403 if `isSystem`, 409 if assigned to users)

## Must never

- Expose or mutate `UserPermission`/`UserRole` rows — those belong to `users`.
- Let any caller check a role name instead of a permission code.
