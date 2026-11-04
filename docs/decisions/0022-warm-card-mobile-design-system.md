# 0022 — Warm Card mobile design system (supersedes 0020)

Date: 2026-11-03
Status: Accepted (owner confirmed 2026-11-03)

## Context

An Impeccable design-system critique (`.impeccable/critique/2026-11-03T19-54-32Z__docs-decisions-0020-ink-mobile-theme-md.md`, 26/40) found that Ink (ADR 0020) was a palette without a system: no component anatomy, motion or haptic spec; Android showing stock Material behaviour (ripple, date pickers, drag handles, menus, app bar, button elevation) under a monochrome skin; iOS owning no button, field, segment, sheet or spacing primitives; typography split between IBM Plex Sans on Android and the system font on iOS. The owner's brief: replace Ink with a cleaner, more premium, more custom world.

## Decision

- The visual world is **Warm Card**, chosen by the owner on the Impeccable decision page after a steered re-roll (seed reference `seed:9bf240e7a29f57ff`): a warm tinted ground, soft white cards, one action orange that appears only on pressable elements, status hues as the only other colour, Onest for UI and Sometype Mono (shared with the web client) for IMEI, money and counts. `DESIGN.md` at the repo root is the system of record; `.impeccable/design.json` carries motion, haptics and component snippets.
- **Shared tokens, platform-specific anatomy.** Both apps consume the same tokens, type ramp, spacing scale, status meanings, motion and haptic vocabulary. Android keeps Material 3 structure themed from the tokens (elevation 0, press spring instead of ripple, hidden drag handle, themed pickers and menus). iOS keeps HIG structure and gains the kit primitives it lacked (button, field, segmented control, filter sheet, spacing tokens).
- **Signature move:** the capture spring. A scanned unit springs into its list from the scan field with a light haptic; the only authored motion.
- Light mode leads (bazaar daylight); dark mode is a warm dark and ships together.
- Build order: Android `shared/ui` first (nine Material leaks), then iOS kit, then the capture spring and haptics on both, then polish and a re-critique. `docs/design/mobile-themes/theme-01-ink.html` becomes an archive, not a token source.

## Consequences

- ADR 0020 is superseded; `Tokens.kt`, `Theme.kt`, `Type.kt` and `Tokens.swift` are rewritten from `DESIGN.md`, and every `Tokens.*` call site keeps its name where the role survives.
- Fonts change on both platforms (Onest, Sometype Mono); IBM Plex files are removed.
- Status pills, cards and scanner components keep their APIs; only tokens and anatomy change, so feature screens are retouched, not rewritten.
- The web client is untouched; aligning its Caldera system with Warm Card is a separate decision.
