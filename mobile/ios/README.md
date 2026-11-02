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
