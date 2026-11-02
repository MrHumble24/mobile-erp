# mobile_erp — Foundation (wave 0)

Read this before adding a feature. State = **Riverpod**, offline-first, one slice
per feature. 300-line hard limit per file.

## Layering (import downward only)
```
app/      entry, go_router + redirect guard, adaptive AppShell, PermissionGate
l10n/     i18n loader + bundled uz/en JSON (context.t)
features/<slice>/ data/ (repo+models) · application/ (Riverpod) · presentation/ (screens)
data/local/  Drift DB + DAOs + outbox + sync cursor   (schema owned by integrator)
data/sync/   pull (/sync/changes) · push drain (/sync/push) · conflicts · connectivity
core/     config · dio + interceptors · AppException · secure storage · ids · authEvents
shared/   theme/ (Caldera ✓) · ui/ (kit, barrel ui.dart) · lib/ (money)
```

## THE EXTENSION CONTRACT (add a feature without editing another agent's file)
A feature lives entirely under `lib/features/<slice>/`. Export one module file
`features/<slice>/<slice>_module.dart` with `List<RouteBase> <slice>Routes` and
`List<NavItem> <slice>NavItems`. Register it in the ONE shared file
`app/router/feature_registry.dart` — add an import + two one-line spreads (TODO
markers show exactly where). Nothing else in `app/` changes.
- **Route** needing a permission: wrap the screen in `PermissionGate(permission: 'x.y', child: ...)` → inline 403.
- **Nav item**: `NavItem(route, labelKey, icon, permission)`; the shell filters by `can()` and renders rail (≥800px) or bar.
- **Providers**: decentralized — each feature declares its own. No shared providers file to edit.
- **Drift**: you READ the existing tables (`db.select(db.devices)...watch()` in your repo). Need a NEW table? Ask the integrator — do not edit `data/local/`.

## Server-contract gotchas
- Base URL via `--dart-define=API_URL=…` (default `http://localhost:3000`, no prefix). One `dioProvider`; never new a client.
- **Cost fields redacted** (`acquisitionCost`, `landedCost`, `landedCostSnapshot`, `overheadCost`, `repairCostEstimate`, `netProfit`) are *absent* for under-privileged users → model them nullable; the sync cache omits them entirely.
- Errors → `AppException {statusCode, message, error}`. Wrap dio calls in `runApi(() async {...})`. Send clean DTOs only (`forbidNonWhitelisted`).
- **401** (non-login) auto-clears the session + bounces to `/login`.
- **Offline writes = only 4 types** (`sale.create`, `consignment.{create,settle,return}`): enqueue to the outbox (`OutboxDao.enqueue`, id = `newUuidV4()`), then rely on the push drain. Every other write is online-only — gate on `connectivityProvider` and block with a message when offline; never fake-queue.

## Helpers available
- **Permissions**: `ref.watch(canProvider)('device.read')`; `permissionsProvider` for the set. Checks CODES, never roles.
- **i18n**: `context.t('nav.pos', {'name': x})`; `localeProvider` (default `uz`). Missing uz key falls back to en.
- **Money**: `parseMoney(str) → Decimal`, `formatMoney(str)`. Never parse money as double.
- **ids**: `newUuidV4()` (outbox + terminal id). **terminalId**: `terminalIdProvider`.
- **Sync**: `syncControllerProvider.syncNow()`, `pullServiceProvider`, `pushServiceProvider`, `conflictStoreProvider`.
- **UI kit** (`shared/ui/ui.dart`): `AppCard`, `StatusChip`, `AppDataTable`, `AppFormField`, `ScannerField`, `showAppDialog`, `showAppBottomSheet`, `Loading`/`EmptyView`/`ErrorView`.

## Deliberate wave-0 stubs
- `common.forbidden` / `common.offline` exist in **en only** — Uzbek copy is a Gemini handoff (en fallback shows meanwhile).
- Push `applied` result does not upsert the returned record (a later pull reconciles); wave 4/5 add record-specific handling if needed.
- Offline login deferred (12h token only) per plan ADR 0005.
