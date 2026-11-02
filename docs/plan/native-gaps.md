# Native mobile — remaining gaps (checkpoint 2026-11-02)

**Status (2026-11-02, done):** kit + all 8 feature groups + camera number reading
(barcode/QR/IMEI auto, other numbers tap-to-pick) merged to `main` on both platforms
(015115a); Gemini's iOS polish kept on conflicts. Single branch `main`. Open: Gemini keys
`common.loadMore`, `common.clear`, `common.offline`, `dashboard.quickActions`,
`inventory.selectDevice`, `shipments.selectShipment`, `qc.dateRange`, `pos.notInStock`;
Gemini restyle of the new screens (POS cart lines, report tabs, expense tabs); device testing.

State: `main` has both native apps (`mobile/android`, `mobile/ios`) with all web
features at base level + developer console. Both builds green. Not yet tested on
a device. User polishes UI with Gemini on `main` in parallel — commit-check before
merging, keep Gemini's look on conflicts.

## How to resume (same pattern as before)
1. **Kit step** — one worktree agent per platform adds shared pieces:
   cross-feature navigation (`open("inventory", imei)`, `pos`, `qc`, `sales`,
   `consignments`), global toast API, date-range picker, load-more pagination,
   CSV build + share sheet. Documented in each `FOUNDATION.md`.
2. **Feature step** — 4 groups × 2 platforms = 8 worktree agents, each first
   merges its platform's kit branch: `sales`, `finance`, `stock`, `admin` (below).
3. Integrator merges all into `main`, runs both gates, `graphify update .`.
Gates: `cd mobile/android && ./gradlew assembleDebug testDebugUnitTest`;
`cd mobile/ios/Mobile-erp && xcodebuild -scheme Mobile-erp -destination 'generic/platform=iOS Simulator' build`.
iOS = one Swift module → prefix slice-local types. Android = exact Caldera theme.

## Gaps (both platforms)
**sales** — multi-device POS cart (check server for one sale.create per device vs
lines; outbox + expectedVersion per device); attach existing customer (typeahead);
sales filters search/returned/warranty/cashier; date-range picker; sales + customer
stats tiles; load more; CSV export.
**finance** — report tabs Overview/Sales/Inventory/Nasiya; trend chart + other
report charts (Android Canvas, iOS Swift Charts); breakdown drill-downs; recurring
expenses; expense filters (search, amount, sort, date); expense detail; category
edit/deactivate/reassign; expenses CSV; dashboard quick actions.
**stock** — device sheet "Sell in POS"/"Run QC"; toasts; tablet master-detail
(devices, shipments); post-intake landed-cost summary; QC custom date range;
inspections pass/fail filter; load more on queue/inspections/shipment devices.
**admin** — users load more; role source labels in overrides; partner
active/overdue filters (online list, mirror offline); consignment date range,
load more, CSV, links to device + sale; native date picker for due dates;
counted roleInUse message.
**everywhere** — Uzbek copy for sync/offline/dev-console keys (Gemini handoff).

## Known server issue
`mobile-api.abdulboriy.dev` serves Traefik's self-signed default cert → apps
can't log in to production until a real certificate is issued.
