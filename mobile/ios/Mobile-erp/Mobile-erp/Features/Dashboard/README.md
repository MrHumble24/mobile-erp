# Dashboard slice

Management dashboard: a shortcut tile row, one KPI list-card (today/week/month),
low-stock alerts, overdue consignments and model pricing — the same anatomy,
row order and captions as the Android `features/finance` dashboard. Auth-only; each card is gated by its own
endpoint's permission, so a cashier sees nothing finance-related.

## Owns
- `/reports/profit`, `/reports/model-pricing`, `/stock-alert-rules/low-stock`,
  `/consignments/overdue`, `/device-models` reads. Served live when online, from
  the last cached response when offline (generic GET cache in `APIClient`).

## Public API
- `DashboardModule.feature` — register with one line in `FeatureRegistry`.
  Feature id `dashboard`; the integrator makes it the shell start destination.

## Permissions (per card)
- `report.finance` — KPIs + model pricing. `device.read` — low stock.
  `consignment.read` — overdue. `device.cost.view` — acquisition-cost figure.

## Must never
- Import another feature slice (DTOs/tiles duplicated by design).
- Edit the shell / home / foundation.

## Notes
- KPI period upper bound is end-of-today (not `now`), so the profit URL is
  stable within the day and the offline cache can serve it on the next launch.
- Quick actions (`DashboardQuickActions`) jump to POS / inventory / QC / sales /
  nasiya via the kit's `KitRouter`; each shows only with its destination's
  permission. Rendered as equal-width surface-2 tiles with the feature's nav
  glyph, no heading, no card — the Android shortcut row.
- Screen title is `nav.dashboard` (the tab label), not `dashboard.title`, so the
  title, the tab and the Android top bar all read the same string.
- KPI rows (shared `MetricList`) use only keys that exist in the shared Uzbek
  bundle; the earlier English subtitles were untranslated fallbacks.
