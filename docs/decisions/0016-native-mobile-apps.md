# 0016 — Native Android + iOS apps replace Flutter

Date: 2026-11-02
Status: Accepted

## Context
A Flutter port (`mobile_erp/`, waves 0–8) shipped, but the owner chose native
apps per platform. The web client stays the desktop terminal. Mobile `mobile/`
was reserved in CLAUDE.md and never started.

## Decision
- Two native apps: `mobile/android` (Kotlin, Compose) and `mobile/ios`
  (SwiftUI). No shared code layer (KMP rejected: build complexity > duplication cost
  for a single-store app).
- Platform-native minimal dependencies: Android Retrofit + Room + CameraX/ML Kit,
  manual DI; iOS zero third-party packages (URLSession, SwiftData, VisionKit).
- Offline-first with the Flutter model unchanged: devices + partners mirrored from
  `/sync/changes`; outbox only for the four server push handlers.
- i18n reads `client/src/shared/i18n/{uz,en}` as the single source; no copies.
- Flutter app deleted; history `47971dd` is the porting spec. Plan:
  `docs/plan/native-waves.md`.

## Consequences
- Every feature is written twice (Kotlin + Swift); slice names match across
  platforms and the web client so a change is traceable in all three.
- iOS 17 minimum (SwiftData, `@Observable`). Camera scanning works in the iOS
  simulator only via HID fallback; use a device for VisionKit.
- Desktop (macOS/Windows) native targets are dropped; the web client covers them.
