# Mobile-erp (iOS) — Foundation (wave 0)

Read before adding a feature. Offline-first, one slice per feature, 300-line
hard limit per file. Zero third-party packages (SwiftUI, SwiftData, URLSession,
VisionKit only).

## Layering (import downward only)
```
App/      entry, RootView, AppShell, FeatureRegistry, PermissionGate, AppContainer
Features/<Slice>/  Data/ (repo + Codable DTOs) · Model/ (@Observable) · UI/ (views)
Data/Local/  SwiftData models + Outbox        (schema owned by the integrator)
Data/Sync/   pull (/sync/changes) · push drain (/sync/push) · conflicts · connectivity
Core/        AppConfig · DevConfig · APIClient · AppError · Keychain · JWT · IDs
Core/Logging/  AppLog (events) · NetLogStore (HTTP) — in-memory ring buffers
I18n/ Theme/ Shared/UI/   stack-level, no business words
```

## THE EXTENSION CONTRACT (add a feature without editing another agent's file)
A feature lives entirely under `Features/<Slice>/`. Define one module:
```swift
enum DevicesModule {
  static let feature = FeatureModule(
    id: "devices", labelKey: "nav.inventory", systemImage: "externaldrive",
    permission: "device.read", root: { AnyView(DevicesView()) })
}
```
Register it with ONE line in `App/FeatureRegistry.swift` (`DevicesModule.feature`).
Nothing else in `App/` changes. The shell hides entries the user can't `can()`
see and wraps every root in `PermissionGate` (inline 403) as a safety net.
The shell lands on `FeatureRegistry.all.first` — currently `DashboardModule`.
Registered now (display order): Dashboard, Pos, Sales, Inventory, Shipments, Qc,
Consignments, Partners, Customers, Expenses, Reports, Users, Settings, Sync.
Slice READMEs are `README.md`; the app target excludes every `.md` from its bundle
via a synchronized-group exception set in the pbxproj (so duplicate names are fine).

## Reading the data (from any view)
```swift
@Environment(AppContainer.self) private var container
@Environment(I18n.self) private var i18n
```
- SwiftData cache (devices, partners) — pass `container.modelContext` into a
  `@Query` or `FetchDescriptor` in your Model layer. Offline reads everywhere.
- Permissions: `container.session.can("device.read")` — CODES, never roles.
- i18n: `i18n.t("nav.pos", ["name": x])`. Default `uz`, falls back to en.
- Money: `MoneyText(value: decimalString)` / `MoneyText.format(_)`. Never Double.
- Connectivity: `container.connectivity.isOnline`.

## Writes
- **Offline-queueable = only 4 types** (`OutboxType`: `.saleCreate`,
  `.consignmentCreate/.consignmentSettle/.consignmentReturn`):
  `try container.outbox.enqueue(.saleCreate, payload: dto, baseVersion: v)`.
  The sync controller drains them via `/sync/push`; never fake-queue anything else.
- **Every other write is online-only**: gate on `container.connectivity.isOnline`
  and block with a "needs connection" message when offline. Call the API through
  `container.api` (the only HTTP client) — it ships `get`/`post`/`put`/`patch`/
  `delete` plus `*JSON` variants for `[String: Any]` bodies (explicit `null` to
  clear a field). A non-login 401 clears the session. Never open a second
  `URLSession` from a slice.

## UI kit (`Shared/UI/`) — use these, prefer stock SwiftUI otherwise
`AppCard` · `StatusBadge(deviceStatus:label:)` · `MoneyText` · `ScannerField`
(HID + camera) · `LoadingView` / `EmptyStateView` / `ErrorStateView` ·
`ForbiddenPanel`. Use stock `List`/`Form`/`NavigationStack`/`Picker`/`Menu`/
`Button(.borderedProminent/.bordered)` so iOS 26 Liquid Glass applies to chrome.

## Cross-feature kit (`Shared/Kit/`) — the shared pieces every feature reuses
Stack-level, no business words; prefixed `Kit…` (iOS is one module). Reach for
these before re-rolling navigation, feedback, paging, date filters or export.

**Cross-feature navigation** — `container.router.open(_:)`. One `KitRoute` per
other feature's screen; it switches the tab and parks a one-shot arg the target
consumes. `featureId` must equal the target's `FeatureModule.id`.
```swift
container.router.open(.inventory(imei: "356938035643809"))
container.router.open(.pos())            // .pos(imei:) .qc(imei:) .sales(saleId:) .consignments(id:)
// target feature's root, once on appear/change:
if case let .inventory(imei)? = container.router.consume("inventory") { store.focus(imei) }
```

**Global toasts** — `container.toasts` (overlay mounted once in `RootView`).
Pass a localized string, not a key.
```swift
container.toasts.success(i18n.t("common.success"))
container.toasts.error(err.message)   // .info(_) too; auto-dismiss ~3s
```

**Load-more pagination** — `KitPaginator<Item>` (server `page`/`pageSize` +
`{items,total}`) + `KitLoadMoreFooter`. The footer auto-loads on scroll-in.
```swift
let pager = KitPaginator<Sale> { page, size in
    let r = try await repo.list(filters, page: page, pageSize: size); return (r.items, r.total) }
// .task { await pager.first() } · pager.refresh() on filter change
List { ForEach(pager.items) { SaleRow($0) }; KitLoadMoreFooter(pager: pager) }
```

**Date-range filter** — `KitDateRange { from, to }` (nil = open) + field/sheet.
```swift
@State private var range = KitDateRange.all
KitDateRangeField(range: $range)   // two DatePickers in a sheet; range.isActive to badge
```

**CSV export + share** — `KitCSV.build/escape/write` (RFC-4180, UTF-8 BOM) +
`KitCSVShareButton` (native share sheet via `ShareLink`).
```swift
KitCSVShareButton(filename: "sales.csv", label: i18n.t("sales.exportCsv")) {
    KitCSV.build(headers: ["IMEI", "Price"], rows: sales.map { [$0.imei, $0.price] }) }
```

## Theme rules
Near-monochrome Caldera: app tint = ink-black (`Tokens.ink`, adapts in Dark
Mode), NOT violet. Status colors via `Tokens.deviceStatusColor(code)`. Sometype
Mono for IMEI/money only (`Font.mono`). Apply `.glassEffect`/`.buttonStyle(.glass)`
SPARINGLY and only behind `if #available(iOS 26, *)` with a material fallback —
floating actions / scanner overlay, not everywhere.

## Server-contract gotchas
- Base URL from the dev panel (`DevConfig`), applied at runtime. No path prefix.
- **Cost fields are redacted** (absent, not null) for under-privileged users and
  are never in the sync cache — model them optional.
- Errors → `AppError {statusCode, message, error}` (envelope-aware). Send clean
  DTOs only (`forbidNonWhitelisted` — no unknown/nil keys).
- Sync pull pages `/sync/changes?since=` until `nextSince` is null; push results
  are `applied|duplicate|conflict|rejected` — never silently dropped.

## Logging & the Developer Console
- **Log an event** with a one-liner at the call site:
  `AppLog.info("sync", "pull page: …")` (`debug/info/warn/error(tag:_:)`).
  Lines go to a 500-entry ring buffer + `os.Logger`. No persistence.
- **Network** calls are captured automatically by `APIClient` into
  `NetLogStore` (300-entry ring). `Authorization` and JSON `password` are
  masked; bodies truncate at 64 KB. Don't log requests by hand.
- **Developer console** (`Features/DevConsole/`) is reached from the login
  screen (code `153535`) and, after sign-in, from a **Developer** tab (DEBUG
  always; release only after the code this session — `DevConsoleAccess`). It is
  appended by the shell, not in `FeatureRegistry`.
- **Add a console section** = one view + one line: append a
  `DevConsoleSection(id:title:systemImage:view:)` to `DevConsoleSections.all`.
  Nothing else changes.
- **Environments** are Production / Staging / Development (`AppEnv`). Defaults
  live once in `AppConfig`; the Development URL is auto-detected (`DevHost`:
  simulator localhost, device build-Mac LAN IP via the `DevHost` Info.plist
  key). Per-env URL overrides persist in `DevConfig`; switching env clears the
  session (token is per-env).

## Deliberate wave-0 notes
- `common.forbidden`/`common.offline`/dev-panel copy aren't in the web i18n yet
  (en/literal fallback shows; Uzbek is a Gemini handoff).
- Kit copy missing from web i18n (en/literal fallback; Gemini handoff):
  `common.loadMore` ("Load more"), `common.clear` ("Clear"). The date-range
  picker otherwise reuses `reports.preset_custom`/`dateFrom`/`dateTo` and
  `common.confirm`; toasts/CSV take caller-supplied strings.
- Conflict inbox UI is wave 1; `ConflictStore` ships the fetch/resolve calls.
- Sometype Mono registered via `UIAppFonts`; SF Mono is the automatic fallback.
