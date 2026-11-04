# 0020 — Ink mobile theme

Date: 2026-11-03
Status: Superseded by 0022 (2026-11-03)

## Context

The native mobile apps needed one agreed visual identity. Three candidate themes
were mocked in `docs/design/mobile-themes/`; "Ink" (theme-01-ink.html) was chosen:
pure monochrome (white surfaces / ink-black text, a single hairline border, no
shadows), status is the only colour, IBM Plex Sans for UI and IBM Plex Mono for
IMEI/money/counts. It reads identically on iOS and Android.

## Decision

- `theme-01-ink.html` (`:root` light, `prefers-color-scheme:dark`) is the single
  token source of truth for both platforms. Light and dark palettes are both defined.
- Status mapping is fixed: IN_STOCK → success, DEFECTIVE → danger, CONSIGNED → info,
  SOLD → muted. Status pills get tinted backgrounds (successBg/warningBg/dangerBg/infoBg).
- Radii: cards 12, inputs/controls 10, large 20, pill 9999. No elevation; cards use a
  1 dp hairline border and tonal elevation is off.
- Density matches iOS, not Material defaults: spacing in `Tokens.Space.*`, controls at a
  40 dp touch target (`LocalMinimumInteractiveComponentSize`), body line-height 1.35.

## Consequences

- Android: raw palettes in `ui/theme/Tokens.kt` as `Tokens.Light` / `Tokens.Dark`;
  M3 light/dark schemes + `Shapes` in `Theme.kt` pick via `isSystemInDarkTheme()`;
  `values-night/themes.xml` darkens the window/status-bar chrome. Fonts bundled as
  static IBM Plex TTFs in `res/font`. Dark mode is fully wired to feature screens:
  every adaptive `Tokens.*` colour is a `@Composable @ReadOnlyComposable` getter that
  returns the light or dark value, so the ~40 screens that read `Tokens.*` flip with
  no call-site change; the few non-composable colour helpers were made `@Composable`.
  `Typography` no longer pins text colour so text inherits the adaptive M3 content colour.
- iOS: values live in `Theme/Tokens.swift` as adaptive `Color(light:dark:)`; call-site
  names retargeted, `*Bg` tints added, dead hues removed, control radius 9→10, shadows
  deleted; mono = bundled IBM Plex Mono, UI text stays on the system font. Surface pass:
  screens → `bg`, cards/rows → `surface`, chips/inputs/segments → `surface2`, status
  pills/tiles → `*Bg` tints; only modal filter/edit sheets keep system styling. iOS is
  the density reference the Android `Tokens.Space.*` values above are mirrored from.
