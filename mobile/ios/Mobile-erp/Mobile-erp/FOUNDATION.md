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
  `container.api` (the only HTTP client). A non-login 401 clears the session.

## UI kit (`Shared/UI/`) — use these, prefer stock SwiftUI otherwise
`AppCard` · `StatusBadge(deviceStatus:label:)` · `MoneyText` · `ScannerField`
(HID + camera) · `LoadingView` / `EmptyStateView` / `ErrorStateView` ·
`ForbiddenPanel`. Use stock `List`/`Form`/`NavigationStack`/`Picker`/`Menu`/
`Button(.borderedProminent/.bordered)` so iOS 26 Liquid Glass applies to chrome.

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

## Deliberate wave-0 notes
- `common.forbidden`/`common.offline`/dev-panel copy aren't in the web i18n yet
  (en/literal fallback shows; Uzbek is a Gemini handoff).
- Conflict inbox UI is wave 1; `ConflictStore` ships the fetch/resolve calls.
- Sometype Mono registered via `UIAppFonts`; SF Mono is the automatic fallback.
