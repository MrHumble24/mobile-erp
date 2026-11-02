# features/admin — Admin & Sync slice group

Ports the web client's **Users & Access (RBAC)**, **Settings**, and **Sync**
pages to the native Android app. One `FeatureModule` (`AdminFeature`) contributes
all three nav items and routes.

## Owns
- `data/` — `AdminApi` (Retrofit for `/users`, `/access`, `/settings`), `AdminHttp`
  (slice-local client), `UsersRepository`, `SettingsRepository`, transport models,
  `currentUserId` (self-lock read).
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

## Work-arounds (integrator may fold in)
- `AdminHttp` rebuilds the configured HTTP stack because the foundation
  `ApiService` (off-limits) does not declare the admin endpoints. Cleanest fix:
  add those routes to the one `ApiService`.
- `ui/AdminControls` (checkbox/switch) and `UsersSummary`'s stat tile are built
  from `Tokens` because the shared kit lacks them — candidates to promote to
  `shared/ui`.
