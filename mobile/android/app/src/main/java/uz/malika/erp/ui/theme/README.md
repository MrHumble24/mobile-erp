# ui/theme — Warm Card tokens, type, theme

Mirrors `DESIGN.md` (repo root, the source of truth) into Compose. Change a value
in DESIGN.md and here, nowhere else.

## What owns what
- **`Tokens.kt`** — the palette (`Light`/`Dark` raw values) and every adaptive
  `@Composable` colour getter, plus `Space`, `Radius`, `minTouch` and the fixed
  chart palette. Getters pick light/dark off `isSystemInDarkTheme()`, so feature
  screens reading `Tokens.*` flip with no call-site change. Legacy names
  (`surfaceCanvas`, `foreground`, `primary`, `slate`, `bone`, `destructive`, …)
  are kept as aliases onto the Warm Card roles so old call sites compile.
- **`Type.kt`** — `SansFamily` (Onest) and `MonoFamily` (Sometype Mono), both
  variable TTFs loaded per weight via `FontVariation`, and `calderaTypography`
  (the DESIGN ramp mapped to Material roles). `DataLarge` = 24 sp mono 500.
- **`Theme.kt`** — `MalikaTheme`: the M3 `ColorScheme` (built from the raw
  palette), `Shapes` (12/16/20), the 48 dp minimum touch target, and the ripple
  replacement.

## Token → DESIGN.md mapping
`ground / card / surface2 / border / text / muted` = the neutral roles; `action`
(+`actionPressed`, `onAction`) = the one orange; `success / danger / warning /
info / sold` with their `*Bg` tints = the status hues. `Radius`: cards 16,
inputs/controls 12, buttons 14, pill 999, large (sheets/dialogs) 20. `Space`:
scale 4/8/12/16/20, gutter 20, 52 dp controls, 48 dp rows.

## Material: themed vs replaced
- **Themed from tokens:** ColorScheme roles (primary=action, surface=card,
  background=ground, surfaceVariant=surface2, outline=border, error=danger),
  shapes, TopAppBar / NavigationRail / bottom bar, bottom sheets, dialogs, date
  pickers, dropdown menus, switches, segmented control.
- **Replaced / tamed press feedback.** `LocalIndication` is
  `shared/ui/PressIndication` (scale 0.98 + surface-2 wash, 120 ms, no bounce);
  every `clickable` surface and the kit's `PillButton` (built on `Surface(onClick)`)
  take it. **Exception:** Material internals that ignore `LocalIndication` —
  `IconButton`, `Switch`, `Checkbox`, `DropdownMenuItem`, `NavigationRailItem`,
  `ExtendedFloatingActionButton` — still draw a ripple, so `LocalRippleConfiguration`
  is set (not null) to a quiet monochrome layer:
  `RippleConfiguration(color = Tokens.text, rippleAlpha = RippleAlpha(pressed 0.10,
  focused 0.08, dragged 0.10, hovered 0.06))`. No loud default ripple remains, and
  the brand orange is never used as a ripple.

## Dark mode
Both modes clear WCAG AA (≥4.5:1) for the status hue on its tint. Light hues are
the deep ramp step (success #12603A, danger #AB1E30, warning #7A4D00, info
#2455AD, sold #5E5E5E) on the light tints; dark hues are lifted on a darkened
tint (see the `Tokens.Light` / `Tokens.Dark` comments). `action` stays the same
orange in both modes. The focus ring is `Tokens.text` at 2 dp, never orange.
