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
The Caldera design system (near-monochrome, `client/src/app/styles/index.css`) is
mirrored 1:1 in `ui/theme/Tokens.kt`. Fonts (Plus Jakarta Sans, Inter, Sometype
Mono) are bundled as OFL variable TTFs in `res/font/`. Light theme only; dynamic
color is disabled. Feature screens use the `shared/ui` kit, never raw Material styling.

## Launcher icon
Ported from the iOS brand icon (`mobile/ios/Mobile-erp/Mobile-erp/AppIcon.icon`): a
white "M" monogram over a vertical P3 gradient (converted to sRGB `#432EBA`→`#080C1E`).
Adaptive layers are `res/drawable/ic_launcher_{background,foreground,monochrome}.xml`;
regenerate the legacy mipmap webps from the same vectors with
`python3 -I <scratchpad>/android-icon/render.py` (PIL only — no SVG lib needed).
