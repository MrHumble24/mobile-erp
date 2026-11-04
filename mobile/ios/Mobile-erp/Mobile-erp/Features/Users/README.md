# Users & Access slice

RBAC administration — the native port of the web `pages/users` +
`entities/user`. Users, roles and the two permission matrices.

## Owns
- `UsersModule.feature` — nav + route, gated `user.manage`.
- `UsersView` — segmented Users / Roles / Permission-matrix root.
- Users tab (`UsersListView`): stats, search/role/status filters, load-more
  pagination (`KitPaginator`), create, and a detail sheet (profile, roles,
  per-user overrides, reset password, activate/deactivate).
- Roles tab (`RolesListView` + `RoleDialogs`): create / rename / delete; a
  delete blocked by assignments (409) shows the counted `users.roleInUse`
  message, matching the web.
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

## Warm Card (ADR 0022)
- `UsersView` (its own file now) switches the tabs with the shared `TabChips`
  row and is titled by `nav.users`. The users tab is `ScrollView` + `AppCard`
  rows with the system search bar, filter / new in the toolbar and a
  `MetricList` summary; roles are cards (tap = edit sheet, which also holds
  delete for custom roles); the matrix is an `AppSelect` role picker over one
  card per resource with switch rows and a sticky save/cancel pill bar.
- Every sheet (detail, create user, reset password, create/edit role) is the
  kit sheet with `AppFormField` + `AppTextField` / `AppSecureField` (slice-local,
  the kit chrome around a `SecureField`), `RoleSwitches`, pill buttons; the
  filter sheet is a kit `FilterSheet`. Overrides are surface-2 blocks with a
  three-way `SegmentedControl`.
- DEBUG screenshot args: `-open users`, `-openTab users|roles|matrix`,
  `-openUser first`.

## Notes
- Roles/Matrix tabs are hidden without `role.manage` (the `/access/*` guard).
- All verbs go through the shared `container.api` (`patchJSON`/`putJSON`/`delete`);
  no slice-local HTTP client.
