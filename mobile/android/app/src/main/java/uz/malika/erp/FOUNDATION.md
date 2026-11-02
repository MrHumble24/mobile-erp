# mobile/android — Foundation (wave 0)

Read before adding a feature. Local-first, one slice per feature, 300-line hard
limit per file. State = ViewModel + StateFlow. Package root: `uz.malika.erp`.

## Layering (import downward only)
```
MainActivity / MalikaApplication / AppContainer   process entry + manual DI
app/        navigation, adaptive AppShell, FeatureRegistry, PermissionGate
features/<slice>/  data/ (repo + domain) · model/ (ViewModel, state) · ui/ (screens)
data/remote/  HttpClient → the ONE configured Retrofit; ApiService (auth+sync) + DTOs
data/local/   Room DB + DAOs + entities (devices, partners, outbox, sync_meta)
data/sync/    pull (/sync/changes) · push (/sync/push) · SyncManager · Connectivity · Outbox
core/         Config · DevConfig (3 envs) · DevHost (auto dev URL) · SecureStore · AppException + runApi · Jwt · Ids · AuthEvents · logging/ (AppLog · NetworkLog)
i18n/         I18n loader (reads web JSON from assets) + LocaleStore + LocalT
shared/ui/    the Caldera UI kit     shared/lib/  Money (BigDecimal)
ui/theme/     Tokens (1:1 with web index.css) · Type · Theme (MalikaTheme)
```

## THE EXTENSION CONTRACT (add a feature without editing another agent's file)
A feature lives entirely under `features/<slice>/`. Expose ONE `FeatureModule`
object, then add ONE line to `app/FeatureRegistry.kt`'s `features` list:
```kotlin
object InventoryFeature : FeatureModule {
    override val navItems = listOf(
        NavItem("inventory", "nav.inventory", Icons.Outlined.Inventory2, permission = "device.read"),
    )
    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable("inventory") {
            PermissionGate("device.read") { InventoryScreen(container) }  // inline 403 if denied
        }
    }
}
// FeatureRegistry.features: add `InventoryFeature,`
```
- **Registered now**: `FinanceFeature`, `SalesFeature`, `InventoryFeature`,
  `ProcurementFeature`, `NasiyaFeature`, `AdminFeature`. Nav order is a single
  list in `FeatureRegistry.navOrder` (dashboard → sync); `startRoute` is `dashboard`.
- **Nav item** with a `permission` is hidden unless `can(code)`; the shell renders
  rail (≥600dp) / drawer (>5 items) / bottom bar automatically.
- **Permission-gated route**: wrap the screen in `PermissionGate(code) { ... }`.
- **ViewModels**: each feature builds its own from `container` (see `viewModelFactory`).
  No shared providers file to edit.

## Reading data (offline-first)
- Devices + partners are mirrored locally. Read reactively:
  `container.db.deviceDao().watchAll()` → a `Flow` → `collectAsState()`.
- Need a NEW table? Ask the integrator — do not edit `data/local/`.

## Writing data
- **Offline writes = only the 4 outbox types** (`sale.create`,
  `consignment.{create,settle,return}`): `container.outbox.enqueue(OutboxType.X, payloadJson)`.
  The push drain delivers it; results (applied/duplicate/conflict/rejected) are
  reconciled, never dropped.
- **Every other write is online-only**: gate on `container.connectivity.online`
  and block with a "needs connection" message. Never fake-queue it.

## Developer Console & logging (`features/devconsole/`)
- Reach it from login ("Developer settings", code `153535`) or, once signed in,
  the "Developer" nav item (debug: always; release: after the code this session —
  `DevAccess`). Three sections: **Environment**, **Network**, **Logs**.
- **Add a console section** = one new file + one line: write a `@Composable
  (AppContainer) -> Unit`, then add a `DevConsoleSection(id, title, icon, content)`
  to `DevConsoleSections.all`. Nothing else changes.
- **Log an app event**: `AppLog.d/i/w/e(tag, message, throwable?)` — a one-liner at
  the call site (ring buffer of 500 + Logcat, read live by the console; no
  persistence). Network traffic is captured automatically by `networkLogInterceptor`
  in `HttpClient` (masks `Authorization` + `password`, truncates at 64 KB).
- **Environments**: Production (deployed), Staging (no server yet → blank, blocked
  until a URL is set), Development (auto URL — emulator `10.0.2.2` else the build
  machine's LAN IP in `BuildConfig.DEV_HOST`, port `Config.DEV_PORT`). Any env's URL
  is overridable in the console ("Reset to auto"); switching env clears the session.

## Server-contract gotchas
- Base URL from the Developer Console; Development auto-detects the host (emulator
  vs. the build machine's LAN IP) so no IP is typed. Server has NO prefix.
  **One OkHttp/Retrofit** (`AppContainer.retrofit`, built by `HttpClient`). A slice
  that needs routes beyond `ApiService` declares its own Retrofit interface and
  gets it with `container.retrofit.create(FeatureApi::class.java)` — never a second
  OkHttp client. `ApiService` itself is `retrofit.create(ApiService::class.java)`.
- **Cost fields are redacted** for under-privileged users and are not cached — do
  not model them.
- Errors → `AppException {statusCode, message, error}`; wrap calls in `runApi {}`.
  Send clean DTOs only (`forbidNonWhitelisted`; `explicitNulls=false`).
- **401** (non-login) auto-clears the session → login.

## Helpers
- Permissions: `user.can("device.read")` / `LocalCan.current(code)` — CODES, never roles.
- i18n: `val t = LocalT.current; t("nav.pos")`; default `uz`, falls back to `en`.
- Money: `parseMoney(str): BigDecimal`, `formatMoney(str)`, `MoneyText(str)`. Never a float.
- ids: `newUuidV4()`; terminal id via `TerminalId`. Sync: `container.syncManager.syncNow()`.
- UI kit (`shared/ui`): `PillButton`, `AppTextField`/`AppFormField`, `AppCard`, `StatusChip`,
  `AppDataTable`, `AppConfirmDialog`, `AppBottomSheet`, `SegmentedControl`, `ScannerField`,
  `AppSelect` (labelled dropdown), `MetricTile`/`MetricGrid` (stat cards),
  `Loading`/`EmptyView`/`ErrorView`. **Use the kit — never default Material styling.**
  (`AppSelect` and `MetricTile` were promoted from slices — reuse, don't re-create.)

## Deliberate wave-0 stubs
- Dev-panel / offline / forbidden i18n keys are not yet in the web JSON (Gemini
  handoff); the raw key shows until added. The loader reads the client JSON as-is.
- Camera scanning needs a device (emulator: use the HID text field / a USB wedge).
- `ScannerField` camera = `CameraScanSheet` + `CodeAnalyzer`: every barcode/QR format (ML Kit),
  then on-device OCR for a printed IMEI (`shared/lib/ImeiText` — 15 digits, Luhn check, grouping
  spaces/dashes allowed). All offline. Barcode wins when a frame has both.
- Conflict inbox UI is wave 1; wave 0 ships `ConflictStore` (fetch + resolve) only.
