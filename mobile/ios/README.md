# mobile/ios — Malika ERP/POS (native iOS)

Native SwiftUI port of the web ERP/POS. Offline-first, zero third-party
packages. Porting spec + slice names: the deleted Flutter app at git `47971dd`.
Extension contract for feature agents: `Mobile-erp/Mobile-erp/FOUNDATION.md`.
Screen catalog & business flows: [SCREENS.md](SCREENS.md).

## Requirements
- Xcode 16+ (iOS 17.0 deployment target; iPhone + iPad).
- A running ERP server (`server/`) reachable from the device/simulator.

## Run
```sh
cd mobile/ios/Mobile-erp
open Mobile-erp.xcodeproj      # then Run (⌘R) on a simulator or device
```
Or from the CLI:
```sh
xcodebuild -scheme Mobile-erp -destination 'generic/platform=iOS Simulator' build
```

New `.swift` files under `Mobile-erp/Mobile-erp/` compile automatically
(file-system synchronized group) — do not hand-edit the `.pbxproj` to add files.

## Environments & the Developer Console
Three environments, switched from the in-app developer console:

| Env         | Default URL                           | Notes                                   |
|-------------|---------------------------------------|-----------------------------------------|
| Production  | `https://mobile-api.abdulboriy.dev`   | Defined once in `Core/AppConfig.swift`. |
| Staging     | *(none yet)*                          | No server yet — shows "Not configured"; selecting/testing is blocked until a URL is entered. |
| Development | **auto** `http://<host>:3000`         | Host detected automatically (below).    |

`mobile.abdulboriy.dev` is the **web** app and is not used by the iOS app.

**You never type the dev IP.** The Development host is resolved at runtime:
- **Simulator** → `localhost` (source "simulator").
- **Device** → the build Mac's LAN IPv4, injected into the built `Info.plist`
  as `DevHost` by the *Embed dev host (LAN IP)* build phase (source
  "auto (build Mac)"). The phase declares the built plist as an input so it
  runs **after** Info.plist processing; it writes only the built plist, never
  the source (git stays clean) and omits the key if no LAN IP is found.
- Neither → `localhost`.

Open the console two ways:
1. **Login screen → Developer settings**, enter access code **153535**
   (a convenience gate, not security).
2. **After sign-in**: in DEBUG builds a **Developer** tab is always shown; in
   release builds it appears only once the code was entered this session.

In the **Environment** section you can edit any environment's URL (applies
immediately — no relaunch), **Reset to auto/default**, and **Test connection**
(hits the public `GET /health`; any HTTP response, including 401, counts as
reachable). Switching the active environment confirms, clears the session
(the token is per-environment), and returns to login. Plain-HTTP LAN works via
the ATS exception in `Info.plist` (`NSAllowsArbitraryLoads`). The console also
has **Network** (live request log) and **Logs** (app event log) sections — both
in-memory ring buffers, no persistence.

Dev accounts: `owner@malika.uz` / `cashier@malika.uz` / `qc@malika.uz`
(passwords in `server/.env`).

## Camera scanning
IMEI barcode scanning uses VisionKit's `DataScannerViewController`, which runs
**only on a real device** — the simulator has no camera, so the camera button is
hidden there. The HID hardware-scanner path (keyboard-wedge into `ScannerField`)
works everywhere, including the simulator.

## i18n
Translations are **not** copied here. A build-phase script bundles
`client/src/shared/i18n/{uz,en}` verbatim into the app at build time (single
source). Edit copy in the web client; it flows to iOS on the next build.

## Theme — Warm Card
The app ships the **Warm Card** design system (ADR 0022). Single source of
truth: repo-root [`DESIGN.md`](../../DESIGN.md). New UI uses the Warm Card
tokens and kit, never raw hex, `.secondary`/`.primary`, or stock control styles.

- **Tokens** (`Theme/Tokens.swift`): a warm `ground`, white `card`s (no border,
  no shadow), `surface2` for secondary controls, one `action` orange reserved
  for pressable things (primary action + active tab), and the status hues
  (`success`/`danger`/`warning`/`info`/`sold`) with matching `*Bg` pill tints —
  all adaptive light/dark. `Tokens.Space` and `Tokens.Radius` hold the spacing
  scale (4/8/12/16/20, 52 pt controls, 48 pt rows, 44 pt touch) and radii
  (cards 16, controls 12, buttons 14, pill). Old Ink names are kept as aliases
  (see `Theme/README.md`); do not use them in new code.
- **Fonts**: **Onest** (UI) and **Sometype Mono** (IMEI/money/counts, tabular),
  bundled as variable TTFs in `Resources/Fonts/` and listed in `Info.plist`
  `UIAppFonts`. Because a bundled variable font on iOS 17 does not interpolate
  its `wght` axis via `.weight()`, the axis is set explicitly on a
  `UIFontDescriptor` (`Theme/VariableFont.swift`). The type ramp is
  `Font.ui(.title|.heading|.body|.bodyStrong|.caption|.label)` and
  `Font.data(.regular|.large)` (`Theme/Typography.swift`); each is scaled with
  `UIFontMetrics(forTextStyle:)` — the `relativeTo:` equivalent — so all text
  follows **Dynamic Type**. `Font.mono(_:weight:)` is the same signature as
  before but now scales too.
- **Chrome**: `Theme/AppAppearance.swift` themes the tab bar (on `card`, active
  item in `action`) and the navigation bar at launch via `UINavigationBar`
  appearance — Onest titles in `text` (inline 17/600, large 34/700) on `ground`;
  SwiftUI `.toolbarBackground` in `AppShell` must stay for the title to render.
  The nav content is tinted `text` so toolbar icons are never orange; the root
  tint is `action`, carried only by PillButton primaries and the active tab.
- **Money tint**: financial figures are tinted by meaning and sign in one place
  (`Shared/UI/MoneyTint.swift`): profit is green when ≥ 0 and red when negative,
  revenue is `text`, expenses are always red. Used by the dashboard and reports
  tiles so a loss never reads green.
- **Kit** (`Shared/UI/`, see its README): `PillButton` styles
  (`.pillPrimary`/`.pillSecondary`/`.pillGhost`/`.pillDestructive`),
  `AppTextField`/`AppFormField`, `AppSelect`, `SegmentedControl`, `FilterSheet`,
  the `.appBottomSheet()` / `.appSheet` modifiers, `OfflineBanner`, and the
  restyled `AppCard`, `StatusBadge`, `SummaryTile`.

- **Motion & haptics** (`Shared/Kit/Haptics.swift`, `CaptureSpring.swift`): one
  haptic vocabulary (`tick`/`success`/`error`) and one authored animation — the
  capture spring, where a scanned unit springs into the POS cart / intake list
  while the rest dims for a beat. Both honour Reduce Motion (150 ms fade).

Adopted so far on the **Kassa (POS)** and **Dashboard** screens; the other
feature screens inherit the tokens automatically and get the full kit in a
later pass.

## Screenshots
DEBUG builds accept `-open <tab>` to land directly on a tab for captures
(`home`, `pos` → Kassa, `sales`, `inventory`, `more`):
```sh
xcrun simctl launch <UDID> abdulboriy.Mobile-erp -open pos
xcrun simctl io <UDID> screenshot /tmp/shot.png
```
(iOS maps the `-open <value>` launch argument to the `open` user-default; the
shell reads it in `AppShell` under `#if DEBUG` only.)

### Signed-in captures (DEBUG only)
`-devEmail <email> -devPassword <password>` signs in at launch against the
**Development** environment (simulator → `localhost:3000`) so command-line
captures reach screens behind the login wall. It reuses the real login path
(`Session.login`, `AppContainer.devAutoSignIn`), and `-open <screen>` still
lands on the chosen screen afterwards. The password is never logged (the net
log masks it too). Compiled out of release builds.
```sh
xcrun simctl launch <UDID> abdulboriy.Mobile-erp \
  -devEmail owner@malika.uz -devPassword "$PWD_VAR" -open balance
```
The balance sheets open directly too: `-openBalanceEntry opening|deposit|
withdraw|correction|transfer` (see `BalanceView`).
