# Malika Bazaar — Android app (`uz.malika.erp`)

Native Android port of the mobile ERP/POS. Kotlin + Jetpack Compose, offline-first.
Foundation (wave 0) is in place; the build plan is `docs/plan/native-waves.md`,
the extension contract is `app/src/main/java/uz/malika/erp/FOUNDATION.md`.

## Requirements
- JDK 21, Android SDK 37 (`compileSdk`/`targetSdk` = 37, `minSdk` = 24).
- Gradle wrapper (9.6) is included — no local Gradle needed.

## Run
```bash
cd mobile/android
./gradlew assembleDebug            # build the debug APK
./gradlew installDebug             # install on a running device/emulator
./gradlew testDebugUnitTest        # JVM unit tests
```
Open in Android Studio and Run, or `installDebug` then launch "Malika Bazaar".

## Point the app at a server
The server has **no URL prefix** and listens on `:3000`. Open the **Developer
Console** (login → "Developer settings", code `153535`, or the "Developer" nav
item once signed in) → **Environment**. Three environments:

| Environment | Default URL                              |
|-------------|------------------------------------------|
| Production  | `https://mobile-api.abdulboriy.dev`      |
| Staging     | _(none yet)_ — selectable but blocked until you enter a URL |
| Development | auto-detected (see below)                |

**Development needs no IP typed.** On an **emulator** the host is `10.0.2.2`. On a
**real device** it is the build machine's LAN IPv4, detected at build time by
`detectLanHost()` in `app/build.gradle.kts` and baked into `BuildConfig.DEV_HOST`
(fallback `10.0.2.2`); the port is `Config.DEV_PORT` (3000). The console shows the
detected host and its source ("emulator" / "auto (build machine)" / "override").

Any environment's URL can be overridden in the console and reset to auto/default;
changes persist and apply immediately. Switching environment signs you out (a
token from one environment is invalid in another). "Test connection" pings the
public `/health` route and reports reachable / latency / error. The **Network**
and **Logs** sections show live in-memory HTTP + app logs (no persistence;
`Authorization` and `password` are masked).

Debug builds permit cleartext HTTP (see `res/xml/network_security_config.xml`) so
plain-HTTP LAN servers work. Dev users: `owner@malika.uz` / `cashier@malika.uz` /
`qc@malika.uz` (passwords in `server/.env`).

## i18n
UI strings are read straight from the web client (`client/src/shared/i18n`), mapped
into assets by `app/build.gradle.kts` — a single source, never copied here. Default
locale is Uzbek, falling back to English.

## Theme
The **Warm Card** design system is the source of truth in `DESIGN.md` (repo root)
and is mirrored in `ui/theme/` — see `ui/theme/README.md` for what owns what. A
warm tinted ground with white, borderless, shadowless cards; one action orange
that only ever marks something pressable; status hues the only other colour. Both
light and dark ship (dark status values resolved to WCAG AA on the dark card).
Dynamic Color is disabled — the warm palette is the brand.

- **Fonts** (OFL variable TTFs in `res/font/`): **Onest** for all UI text,
  **Sometype Mono** for IMEI / money / counts (tabular figures). Each weight loads
  the one variable TTF via a `wght` `FontVariation` setting. Variation settings
  apply on API 26+; on API 24–25 (the `minSdk` floor) the variable font falls back
  to its default instance — the ramp still renders at the right sizes/spacing.
  License texts live in `mobile/android/licenses/{onest,sometype_mono}_ofl.txt`
  (they can't sit in `res/font/`, which aapt only allows font resources in).
- **Press feedback, not a loud ripple.** `MalikaTheme` provides a custom
  `shared/ui/PressIndication` as `LocalIndication`: on press a node scales to 0.98
  and a surface-2 wash fades in over 120 ms, easing back with no bounce. Every
  `clickable` surface and the kit's `PillButton` (built on `Surface(onClick)`) pick
  it up. Material internals that ignore `LocalIndication` (IconButton, Switch,
  Checkbox, DropdownMenuItem, NavigationRailItem, ExtendedFAB) keep a ripple, but a
  muted monochrome one — `LocalRippleConfiguration` is retinted to `Tokens.text` at
  low alpha, so no loud default ripple and no orange ripple remain.

- **Motion & haptics** (DESIGN.md). The one authored motion is the **capture
  spring**: a scanned unit springs into the POS cart / intake draft list from the
  scan field while the rest dims for a beat (`shared/ui/CaptureSpring.kt`). Nav
  transitions are Material shared-axis X (30 dp slide + fade, 220 ms). Both honour
  reduce motion (`ANIMATOR_DURATION_SCALE == 0` → a 150 ms fade/crossfade). No
  other entrance or per-section animation. Haptics (`shared/lib/Haptics.kt`,
  `rememberHaptics()`): `tick` on a landed scan, `success` on a completed
  sale/batch, `error` on a duplicate or rejected scan.

Feature screens use the `shared/ui` kit and read `Tokens.*`, never raw Material
styling or hex. The old Ink palette (ADR 0020) is replaced by ADR 0022.

## Launcher icon
Ported from the iOS brand icon (`mobile/ios/Mobile-erp/Mobile-erp/AppIcon.icon`): a
white "M" monogram over a vertical P3 gradient (converted to sRGB `#432EBA`→`#080C1E`).
Adaptive layers are `res/drawable/ic_launcher_{background,foreground,monochrome}.xml`;
regenerate the legacy mipmap webps from the same vectors with
`python3 -I <scratchpad>/android-icon/render.py` (PIL only — no SVG lib needed).
