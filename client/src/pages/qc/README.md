# page: qc

The `/qc` quality-control workspace. Header shows an awaiting-inspection badge
(from `useQcStats`) and a scanner that resolves ANY IMEI via `useDeviceByImei`
and opens the inspection dialog. Composes entities, features and the shared
`widgets/device-drawer`; holds no HTTP of its own.

## Tabs (useUrlTab)
- **Queue** — devices awaiting QC (`inspected=false`) by default; toggles for
  show-inspected, status (in stock / defective), model combobox, storage,
  debounced search, pagination. Row click → device drawer; Inspect → dialog.
- **Inspections** — paginated history with filters (result, grade, defect,
  inspector, date range); row opens a detail sheet linking to `/inventory?imei=`.
- **Stats** — metric cards + by-grade / top-defect bars for a date preset.
- **Lookups** (`settings.manage`) — `features/manage-qc-lookups`.

## Local state (model/)
- `use-qc-queue.ts` — queue filters + pagination; an uninspected device is
  always IN_STOCK, so `inspected=false` alone yields the awaiting queue.
- `use-inspection-browser.ts` — inspection-history filters + pagination.
- `use-stats-range.ts` — date-range preset (today / 7d / 30d / custom).

## Must never
- Call `fetch`/repositories directly, hold server data in local state, or render
  native form/table controls (use `shared/ui`).
