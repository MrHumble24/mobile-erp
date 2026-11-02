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
The server has **no URL prefix** and listens on `:3000`.
- **Emulator** → default `http://10.0.2.2:3000` (host machine) works out of the box.
- **Real device** → open **Developer settings** from the login screen (access
  code `153535`), pick the environment, and set the API base URL to the server's
  LAN IP, e.g. `http://192.168.1.50:3000`. It persists and applies immediately.

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
