# mobile/ios — Malika ERP/POS (native iOS)

Native SwiftUI port of the web ERP/POS. Offline-first, zero third-party
packages. Porting spec + slice names: the deleted Flutter app at git `47971dd`.
Extension contract for feature agents: `Mobile-erp/Mobile-erp/FOUNDATION.md`.

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

## Set the API URL
The app talks to the server base URL with no path prefix (default
`http://localhost:3000`). To point at a LAN server:
1. On the login screen tap **Developer settings**.
2. Enter access code **153535** (a convenience gate, not security).
3. Pick **Development**, set the URL to `http://<your-lan-ip>:3000`, Save.
   It applies immediately — no relaunch. Plain-HTTP LAN works via the ATS
   exception in `Info.plist` (`NSAllowsArbitraryLoads`).

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
