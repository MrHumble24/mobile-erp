# pages/users

Admin screen for accounts and RBAC at `/users`. Three tabs (URL-backed via
`useUrlTab`): Users, Roles, Permissions Matrix.

## Owns

- `model/use-users-filters.ts` — URL-backed search / role / active / pagination
  state; the single source of filters for the Users tab (mirrors sales).
- Users tab: summary tiles, filter row, paginated table with icon actions
  (detail, quick deactivate/reactivate) and a detail Sheet. The Sheet composes
  profile edit, role assignment, per-user permission override matrix
  (inherit / grant / revoke with the source of each code) and password reset.
- Roles tab: create, rename, delete (delete blocked for system roles and shows
  the assigned-user count on 409).
- Permissions Matrix tab: role → permission editor grouped by resource with
  per-resource select-all and an unsaved-changes bar.

## Must never

- Call `useQuery`/`useMutation` or `fetch` directly — all data goes through
  `@/entities/user` hooks.
- Let the current user deactivate themselves or edit their own roles/permissions
  (the server guard is authoritative; the UI disables these for self).

## Data

All reads/writes via `@/entities/user`. Guarded by `user.manage` / `role.manage`
at the router and server.
