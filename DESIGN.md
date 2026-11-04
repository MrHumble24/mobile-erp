---
name: Malika ERP Mobile
description: Warm card system for the Android and iOS apps; one orange that only ever marks something you can press.
colors:
  ground: "#FBF6EE"
  ground-dark: "#1C1713"
  card: "#FFFFFF"
  card-dark: "#2A231D"
  surface-2: "#F4ECDF"
  surface-2-dark: "#352C24"
  border: "#E7DACB"
  border-dark: "#3A312A"
  text: "#2B2B2B"
  text-dark: "#F4EDE4"
  muted: "#8A8378"
  muted-dark: "#A89C8E"
  action: "#FF5A1F"
  action-pressed: "#E64D15"
  on-action: "#FFFFFF"
  success: "#12603A"
  success-bg: "#E3F5EA"
  danger: "#AB1E30"
  danger-bg: "#FBE3E6"
  warning: "#7A4D00"
  warning-bg: "#FCEFD6"
  info: "#2455AD"
  info-bg: "#E4ECFB"
  sold: "#5E5E5E"
  sold-bg: "#EFEAE2"
  success-dark: "#3DB876"
  success-bg-dark: "#0B3F24"
  danger-dark: "#F28F9B"
  danger-bg-dark: "#7E1626"
  warning-dark: "#F0A633"
  warning-bg-dark: "#4D3100"
  info-dark: "#5C8FE5"
  info-bg-dark: "#10264F"
  sold-dark: "#A89C8E"
  sold-bg-dark: "#352C24"
typography:
  title:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  heading:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0em"
  body:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "0em"
  body-strong:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0em"
  caption:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0em"
  label:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.01em"
  data:
    fontFamily: "Sometype Mono, ui-monospace, monospace"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0em"
  data-large:
    fontFamily: "Sometype Mono, ui-monospace, monospace"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.01em"
rounded:
  card: "16px"
  control: "12px"
  button: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  gutter: "20px"
  card-pad: "20px"
  control-h: "52px"
  row-h: "48px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.button}"
    height: "{spacing.control-h}"
    padding: "0 20px"
  button-primary-pressed:
    backgroundColor: "{colors.action-pressed}"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.button}"
    height: "{spacing.control-h}"
    padding: "0 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.button}"
    height: "{spacing.control-h}"
    padding: "0 12px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "{spacing.control-h}"
    padding: "0 16px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
  status-pill:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System: Malika ERP Mobile

## Overview

**Creative North Star: "One orange, always pressable."**

The mobile apps serve a phone-retail booth in Malika Bazaar: a cashier scanning
IMEIs under daylight glare, a QC specialist receiving a batch, an owner reading
the day's takings. The screen is a warm tinted ground with soft white cards, so
the eye reads the cards, not the chrome. Colour has one job: the single orange
marks what can be pressed right now (the primary action, the active tab). It
never decorates. Status hues (in stock, defective, consigned, sold) are the only
other colour and keep their meaning on every screen.

This replaces the Ink theme (ADR 0020, superseded by ADR 0022). Ink was a
palette without a voice: monochrome surfaces with Material and stock-SwiftUI
behaviour showing through. The warm card system is deliberately familiar, the
cleanest reading of a consumer app, and earns its identity through discipline,
not ornament. These values are the shipped build: the same tokens drive
`Tokens.kt` on Android and `Tokens.swift` on iOS, which both name DESIGN.md as
their single source of truth.

**Key Characteristics:**
- Warm tinted ground, white cards, no borders on cards, no shadows anywhere.
- One action colour, reserved for pressable things; disabled actions lose it entirely.
- A rounded humanist sans (Onest) at comfortable sizes; data (IMEI, money, counts) in one mono (Sometype Mono) with tabular figures.
- Generous density tuned to a thumb: 52 dp controls, 48 dp rows, 20 dp gutters.
- The signature move is the capture spring: a scanned unit springs into its list from the scan field with a light haptic.
- Shared tokens on both platforms; component anatomy stays native to each (Material 3 structure on Android, HIG on iOS), themed from these tokens.

## Colors

A warm, low-chroma neutral field carrying one saturated orange and five status hues; nothing else is coloured.

### Primary
- **Action orange** `#FF5A1F` (pressed `#E64D15`) with white text. Appears only on the primary action and the active tab, and stays the same orange in light and dark. Never on text that is not a link, never on icons that are not pressable, never on charts.

### Neutral
- **Ground** `#FBF6EE` (dark `#1C1713`): the screen. A flat warm tint; it is paint, not paper texture.
- **Card** `#FFFFFF` (dark `#2A231D`): every content block. No border, no shadow; contrast against the ground is the edge.
- **Surface 2** `#F4ECDF` (dark `#352C24`): secondary buttons, chips, segmented tracks, the pressed-card wash, inputs on top of a card.
- **Border** `#E7DACB` (dark `#3A312A`): inputs only, 1 dp. The focus ring is the text colour at 2 dp, never orange: a focused field is not a press target, and the scan field is focused all day.
- **Text** `#2B2B2B` (dark `#F4EDE4`); **Muted** `#8A8378` (dark `#A89C8E`).

### Status (the only other colour)
Each pair is a deep hue on its own light tint so pill text clears WCAG AA in bazaar daylight; the same hue drives dots, bars and emphasised numbers. Measured ratios (hue on tint):

- Light: in stock `#12603A` on `#E3F5EA` (6.71:1); defective `#AB1E30` on `#FBE3E6` (5.82:1); warning `#7A4D00` on `#FCEFD6` (6.39:1); consigned `#2455AD` on `#E4ECFB` (5.94:1); sold `#5E5E5E` on `#EFEAE2` (5.42:1).
- Dark: in stock `#3DB876` on `#0B3F24` (4.75:1); defective `#F28F9B` on `#7E1626` (4.52:1); warning `#F0A633` on `#4D3100` (5.82:1); consigned `#5C8FE5` on `#10264F` (4.61:1); sold `#A89C8E` on `#352C24` (5.08:1). The dark values were lifted up the ramp during the build until every pair cleared 4.5:1 on the dark card.

### Named Rules
- **The Pressable Rule.** If it is orange, tapping it does something. If tapping it does nothing, it is not orange.
- **The One Meaning Rule.** Each status hue has exactly one meaning across all screens; the brand colour never doubles as a status.
- **The Money Sign Rule.** A money figure is tinted by meaning and sign, not by metric identity: profit is green at zero-or-above and red when negative, revenue stays the plain text colour, expenses are always danger red. One helper owns this (`signTint` on Android, `moneyTint` on iOS) so a loss never reads green.
- **The Daylight Rule.** Light mode leads (bazaar glare); dark mode is a warm dark, never grey-black, and ships fully tested.

## Typography

**UI Font:** Onest (with system-ui, sans-serif fallback)
**Data Font:** Sometype Mono (with ui-monospace, monospace fallback)

**Character:** A rounded humanist sans with soft terminals that reads warm without reading childish, paired with a single mono for every figure a cashier compares or copies. Both are bundled variable TTFs (`wght` axis) on both platforms, with tabular numerals on by default.

- **UI face: Onest** (400, 500, 600, 700). Chosen for Uzbek Latin and Cyrillic coverage and tabular numerals. iOS maps the ramp to Dynamic Type through `UIFontMetrics` (the `relativeTo` equivalent) so every size scales.
- **Data face: Sometype Mono** (400, 500), the web client's mono, so the three clients share one digit shape. Every IMEI, amount and count is set in it with tabular figures; IMEIs group as 8-6-1 (`35851102 074960 6`) wherever there is room.

### Hierarchy
- **Title** (700, 22px, 1.2): screen titles only.
- **Heading** (600, 17px, 1.25): card and section heads.
- **Body** (400, 16px, 1.35) and **Body-strong** (600, 16px): everything a person reads or taps.
- **Caption** (400, 13px, 1.3): secondary lines under a body line.
- **Label** (600, 12px, 0.01em): pills, keyed labels, tab labels.
- **Data** (400, 15px mono) and **Data-large** (500, 24px mono, -0.01em): amounts, counts and totals.

### Named Rules
- **The Three Sizes Rule.** A screen uses at most three text sizes above caption. Hierarchy comes from size and muted colour, not from bolding everything.
- **The Mono-for-Numbers Rule.** A number a cashier compares or copies is mono and tabular. Prose numbers ("14 kun") stay in Onest.

## Layout

- Single scrolling column of cards with a persistent bottom tab bar; everything reachable by thumb.
- Gutter 20 dp, card gap 16 dp, card padding 20 dp. Row height 48 dp; controls 52 dp. Touch targets 48 dp on Android (enforced via `LocalMinimumInteractiveComponentSize`), 44 pt on iOS, with 8 dp between adjacent targets.
- Tablets (Android ≥ 720 dp): master-detail with the same cards; no re-skin.
- Spacing scale: 4, 8, 12, 16, 20. Nothing else.

## Elevation & Depth

- No shadows. Depth is tint: ground, card, surface-2. A pressed card darkens to surface-2 for the press; a sheet is a card that rises from the bottom on the ground tint with a scrim over the content behind.
- Press feedback is a soft spring on scale (0.98) and a surface-2 wash, not a Material ripple. On Android the theme replaces `LocalIndication` with the Warm Card `PressIndication` and sets `LocalRippleConfiguration` to null for every `clickable` surface and the kit's `PillButton`.

### Named Rules
- **The Flat-By-Default Rule.** Surfaces are flat at rest. The only depth cue is the press response (scale down plus a surface-2 wash); nothing floats.

## Shapes

- Cards 16 dp. Controls and inputs 12 dp. Buttons 14 dp. Pills 999. Nothing square, nothing fully round except pills and avatars. On iOS corners use the continuous (squircle) curve.

## Components

Both platforms ship the same primitives with the same anatomy; structure stays native (Material `Surface`/`OutlinedTextField` on Android, SwiftUI `ButtonStyle`/`TextField` on iOS).

### Buttons
- **Shape:** 14 dp pill, 52 dp tall, zero elevation; label is Body-strong (16/600).
- **Primary:** action orange fill, white label — the one orange on the screen. Pressed fill `#E64D15` plus scale 0.98.
- **Secondary / Ghost:** surface-2 fill (ghost is transparent), text-colour label; never orange. Pressed secondary darkens to border colour.
- **Destructive:** danger fill, white label; press feedback is the 0.98 scale only (no pressed-tint token).
- **Disabled:** loses the fill entirely — surface-2 background, muted label.

### Cards / Containers
- **Corner Style:** 16 dp.
- **Background:** card white on the warm ground.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** none.
- **Internal Padding:** 20 dp. A tappable card darkens to surface-2 on press.

### Inputs / Fields
- **Style:** white card fill, 1 dp warm border, 12 dp radius, 52 dp tall; muted placeholder.
- **Focus:** border thickens to 2 dp in the text colour — never orange (see The Pressable Rule).
- **Error:** border turns danger red; inline error line below in danger.
- **Labelled field:** a 12/600 muted label sits 6–8 dp above the field.

### Status Pill
- **Style:** a status hue on its paired light tint, 999 radius, 4px/10px padding, Label type. One hue per meaning (in stock, defective, consigned, sold, warning); a non-status hue falls back to the neutral surface-2 chip.

### Navigation
- **Bottom tab bar** on card, Label type (11/600), muted inactive items; the active tab is the second and only other place orange appears. iPhone shows 4 tabs plus a custom More tab (never UIKit's "More"); iPad uses a sidebar.

### Scan / capture (signature)
- The scan field feeds the capture spring: a scanned unit springs into the list from the field with a light haptic (see Motion & Haptics). The one authored moment in the app.

## Motion & Haptics

- **Capture spring (signature).** When a scan lands, the new unit's card springs in from the scan field (translateY from −24 dp, scale from 0.96), on a spring of ~350 ms (iOS `response: 0.35, dampingFraction: 0.75`; Android `dampingRatio 0.75, StiffnessMediumLow`) with slight overshoot, while the rest of the list dims to 60% for one beat (~250 ms) and returns. The only authored motion; everything else is state.
- **Press.** 120 ms, `cubic-bezier(0.2, 0, 0, 1)`: scale to 0.98 and a surface-2 wash (Android caps the wash alpha at 0.4). No bounce on entry.
- **Navigation.** Android uses Material shared-axis X (30 dp horizontal slide + fade, 220 ms, reversed on pop); iOS uses the standard HIG push.
- **Reduce motion.** The capture spring becomes a 150 ms fade with no dim; navigation becomes a 150 ms crossfade on Android.
- **Haptics.** One vocabulary, one helper per platform: **tick** = scan captured (Android `HapticFeedbackConstants.CONFIRM`, API 30+, else `KEYBOARD_TAP`; iOS `.impact(weight: .light)`), **success** = sale/batch completed (Android two CONFIRM pulses 120 ms apart; iOS `.success`), **error** = duplicate or rejected scan (Android `REJECT`, else `LONG_PRESS`; iOS `.error`).

## Platform Anatomy

- **Shared:** every token above, the type ramp, status meanings and measured ratios, the spacing scale, the motion and haptic vocabulary.
- **Android:** Material 3 structure (NavigationBar, TopAppBar, ModalBottomSheet, DatePicker) themed from these tokens — shapes 16/12/14, colour roles mapped, elevation 0, ripple replaced by the press spring. Material internals that ignore `LocalIndication` (IconButton, Switch, Checkbox, DropdownMenuItem, NavigationRailItem, ExtendedFAB) keep a ripple, but a muted monochrome one: `LocalRippleConfiguration` is retinted to the text colour at low alpha (pressed 0.10), never the loud coloured default.
- **iOS:** HIG structure (tab bar, navigation stack, sheets) with cards instead of grouped lists for content; kit PillButton, AppTextField, SegmentedControl, FilterSheet built from these tokens. The UIKit chrome SwiftUI still renders is themed once at launch via `AppAppearance`: nav bar on ground with Onest titles in text (inline 17/600, large 34/700), tab bar on card with the active item in action and others in muted. Toolbar icons are tinted text, not the app-tint orange.

## Do's and Don'ts

### Do:
- **Do** keep the ground warm and flat and the cards white; let contrast be the edge.
- **Do** put orange only on the one thing to press on this screen (primary action, active tab).
- **Do** set every IMEI, amount and count in Sometype Mono with tabular figures.
- **Do** tint money by sign through the one helper, so a loss never reads green.
- **Do** ship light and dark together, tested in bazaar daylight and at 1.3x font scale.

### Don't:
- **Don't** add borders or shadows to cards; don't add textures to the ground.
- **Don't** use orange for icons, headings, charts, or status — the field focus ring is the text colour, not orange.
- **Don't** bold to create hierarchy; change size or mute instead.
- **Don't** let Material or stock-iOS parts show through untinted (ripple, calendar, drag handle, elevated menus).
