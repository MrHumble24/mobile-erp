# features/inventory

The Inventory slice group, ported from the web `pages/inventory` +
`device`/`device-model`/`stock-alert` slices and the deleted Flutter app
(`47971dd`). One `FeatureModule` → `InventoryFeature`, one nav item (`inventory`,
gated by `device.read`).

## Owns
- **Devices**: offline-first list (Room mirror) with scan/search + model/storage/
  status filters, metrics bar, and a detail sheet (specs, QC, status history,
  barcode). Edit specs + target price and manual status transitions (ADR 0012)
  are online-only writes. Margin row shows only when landed cost is present
  (cost is redacted → null for under-privileged users).
- **Models**: device-model list + create/edit with the dynamic attribute schema
  (ADR 0013). Shown only with `device.update`.
- **Alerts**: low-stock list + alert-rule create/edit; writes need `settings.manage`.

## Public API
`InventoryFeature` (the module object) only. No other slice imports from here.

## Must never
- Edit foundation (`core/data/shared/theme/app`) or another feature slice.
- Queue writes to the outbox — only `sale`/`consignment` may; every write here is
  online-only and blocks with a needs-connection message when offline.
- Model or cache cost fields.
- Hand-write Uzbek — all copy comes from web i18n keys via `t()`.

## Notes
- `data/InventoryApi.kt` is a slice-local Retrofit (device/model/stock endpoints
  are not on the foundation `ApiService`); it reuses the container's base-URL +
  auth behaviour. `ui/AppSelect.kt` is a slice-local Caldera select (the kit ships
  none). Both are candidates for the integrator to promote.
- `t("common.offline")` is not yet in the web i18n JSON (Gemini handoff); it falls
  back to the raw key until added.
