# Users & Access slice

RBAC administration — the native port of the web `pages/users` +
`entities/user`. Users, roles and the two permission matrices.

## Owns
- `UsersModule.feature` — nav + route, gated `user.manage`.
- `UsersView` — segmented Users / Roles / Permission-matrix root.
- Users tab (`UsersListView`): stats, search/role/status filters, pagination,
  create, and a detail sheet (profile, roles, per-user overrides, reset
  password, activate/deactivate).
- Roles tab (`RolesListView` + `RoleDialogs`): create / rename / delete.
- Matrix tab (`PermissionMatrixView`): edit a role's permissions.
- `UsersCatalog` (roles + permissions + role CRUD), `UsersListModel`,
  `UserDetailModel`, `OverrideMatrix` (pure override reducer + DEBUG self-check).

## Public API
`UsersModule.feature`.

## Must never
- Write offline. Every mutation here is online-only (none are outbox types) and
  blocks with a needs-connection message offline.
- Gate on role names — only permission codes (`user.manage`, `role.manage`).
- Self-edit roles / permissions / deactivation (locked, as on the web).
- Talk HTTP outside `UsersRepository`.

## Notes
- Roles/Matrix tabs are hidden without `role.manage` (the `/access/*` guard).
- All verbs go through the shared `container.api` (`patchJSON`/`putJSON`/`delete`);
  no slice-local HTTP client.
