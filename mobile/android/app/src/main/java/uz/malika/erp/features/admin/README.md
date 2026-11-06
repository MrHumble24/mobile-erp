# features/admin — Admin & Sync slice group

Ports the web **Users & Access (RBAC)**, **Settings**, and **Sync** pages.
One `FeatureModule` (`AdminFeature`) contributes the routes.

## Owns
- `data/` — `AdminApi` (via `container.retrofit.create`), `UsersRepository`,
  `SettingsRepository`, `currentUserId` (self-lock read).
- `model/` — `UsersViewModel`, `AccessViewModel`, `SettingsViewModel`,
  `SyncViewModel`, pure `validateSettings`, the `Async` load-state.
- `ui/` — `UsersScreen` (Users / Roles / Permission-matrix), user detail
  sheet, role editors, `SettingsScreen`, `SyncScreen`.

## Step 11 (ADR 0043/0060)
- Settings edits the bonus switches (`bonusEnabled`, earn/max percents) and
  the printing switches (`receiptPrintingEnabled`, `receiptPaperWidthMm`,
  `priceTagsEnabled`) plus the shop identity used on receipts
  (`storeName`, `storeAddress`, `storePhone`, `receiptFooter`).

## Public API
- `AdminFeature : FeatureModule`. Integrator adds `AdminFeature,` to
  `FeatureRegistry.features`.

## Nav / permissions (CODES, never roles)
- `users` → `user.manage`, `settings` → `settings.manage`, `sync` → none.

## Must never
- Edit foundation or `FeatureRegistry`; import another feature slice;
  queue admin writes offline (only sale/consignment use the outbox).
