# features/admin — Admin & Sync slice group

Ports the web client's **Users & Access (RBAC)**, **Settings**, and **Sync**
pages to the native Android app. One `FeatureModule` (`AdminFeature`) contributes
all three nav items and routes.

## Owns
- `data/` — `AdminApi` (Retrofit interface for `/users`, `/access`, `/settings`,
  built via `container.retrofit.create(...)`), `UsersRepository`,
  `SettingsRepository`, transport models, `currentUserId` (self-lock read).
- `model/` — `UsersViewModel`, `AccessViewModel`, `SettingsViewModel`, `SyncViewModel`,
  pure `validateSettings`, the `Async` load-state, and the VM factory.
- `ui/` — `UsersScreen` (Users / Roles / Permission-matrix sections), user detail
  sheet (profile / roles / overrides + activate / reset-password), role create /
  rename / delete / permission editors, `SettingsScreen`, `SyncScreen`.

## Public API
- `AdminFeature : FeatureModule`. Integrator adds `AdminFeature,` to
  `FeatureRegistry.features`.

## Nav / permissions (CODES, never roles)
- `users` → `user.manage`, `settings` → `settings.manage`, `sync` → none.
- Sync's conflict inbox is gated inside by `sync.resolve`.

## Must never
- Edit foundation (`core/data/shared/theme/app`) or `FeatureRegistry`.
- Import another feature slice.
- Queue admin writes offline: every write here is online-only and blocked with a
  needs-connection message when offline (only sale/consignment use the outbox).
- Model cost fields — these projections never carry money.

## Notes
- `AdminApi` rides the one shared `AppContainer.retrofit` (base-URL/bearer/401
  pipeline) — no slice-local client.
- `UsersSummary` uses the promoted `shared/ui/MetricTile`. `ui/AdminControls`
  (checkbox/switch) stays slice-local (single use).
- Web parity: users list "load more" (kit `PageState`+`LoadMoreFooter`); override
  source badge per permission (from `effective-permissions.roleGrants`); counted
  `users.roleInUse` on 409 (count scraped from the message — no structured field).
