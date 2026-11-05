# shared/ui — stack-level Compose kit

Warm Card primitives (DESIGN.md) with no business meaning (cards, buttons,
fields, chips, sheets, toggles, date pickers, scanner). Feature screens compose
these; colours come from `Tokens.*` getters, spacing from `Tokens.Space.*`, radii
from `Tokens.Radius.*` — never ad-hoc literals. Press feedback is the theme's
`PressIndication` (scale + surface-2 wash); Material internals that ignore
`LocalIndication` fall back to a muted monochrome ripple, never the loud default.

## Compact-width rule (phones < 600dp)

`Responsive.kt` owns one breakpoint, `COMPACT_WIDTH_DP = 600` — the same number
`app/AppShell` switches its nav chrome on. On compact width nothing lays content
side by side in columns; each piece stacks as a full-width row. Wide windows
(≥ 600dp, the NavigationRail layout) keep columns.

- `isCompactWidth()` — the single detector (`LocalConfiguration.screenWidthDp <
  COMPACT_WIDTH_DP`). Every responsive component below reads it; features never
  re-derive the breakpoint.
- `AdaptiveInputs(fields)` — two (or more) inputs side by side (`weight(1f)`) on
  wide, stacked full-width on compact. Use it for any paired form inputs
  (min/max amount, cost/price, label/key) instead of a hand-rolled `Row`.
- A multi-column `AppDataTable` collapses on compact to one stacked two-line
  record per row (first column = primary text, the rest labelled). Pass
  `stackOnCompact = false` only for a true matrix that must stay a grid (the
  permission matrix), which then stays horizontally scrollable at every width.

## Component contracts

- `PillButton` — the one button: radius 14 (`Tokens.Radius.buttons`), 52 dp tall,
  zero elevation in every state. Variants: PRIMARY (the one orange, action fill),
  SECONDARY / OUTLINE (both borderless surface-2 — Warm Card has no borders except
  inputs; OUTLINE keeps its name only), GHOST (transparent), DESTRUCTIVE (danger).
  Disabled is surface-2 / muted. Press feedback is the theme indication.
- `AppTextField` / `AppFormField` / `AppSelect` — white card container, radius 12,
  1 dp warm border thickening to a 2 dp action ring on focus, action cursor, muted
  placeholder, danger error border; field label 13/600 muted above with a 6 dp
  gap. `AppSelect`'s menu is themed (card, radius 16, zero elevation, selected item
  tinted surface-2).
- `SegmentedControl` — a surface-2 track; the selected segment is a white card with
  a text-colour label, the rest muted; radius 12, height 44, no Material border or
  selection check-mark. Labels are single-line and ellipsize on a narrow segment.
  Segments are laid out by a custom `Layout` (not Row weights): with a bounded
  width they split it equally; inside a `horizontalScroll` (unbounded width, e.g.
  the Developer Console tab bar) they size to the widest label and the row scrolls.
  A weight there used to collapse every segment to ~1 px.
- `AppBottomSheet` — white card, no drag handle, 20 dp top corners, zero tonal
  elevation, 40%-of-text scrim.
- `AppConfirmDialog` — white card, radius 20, zero tonal elevation, titleMedium
  over bodyLarge, `PillButton`s (primary / secondary) for the choices.
- `AppSwitch` / `AppCheckbox` (`Toggles.kt`) — the shared toggles: checked uses the
  action orange, unchecked rests on a surface-2 track with a warm border. One
  definition for admin, procurement and inventory.
- `warmDatePickerColors()` / `DatePickerDialogShape` (`DatePickerTheme.kt`) — one
  Warm Card palette (white container, action-orange selected day + today ring,
  neutral text, surface-2 year chip) and the 20 dp dialog shape, passed to every
  date-picker site so none shows a stock Material calendar.
- `StatusChip` — pill, labelMedium 12/600, a soft tint of the passed status hue as
  the background with the hue as the label (one argument carries both). Status
  meaning is owned by `DeviceStatusMeta.color` and the status tokens.
- `TabChips` (`TabChips.kt`) — tabs as a scrolling chip row (optional mono count and
  hue per chip) for the places a fixed `SegmentedControl` would truncate three or
  more labels. Promoted from the nasiya slice when the users screen needed it.
- `FactRow` / `SubjectBlock` (`DetailBlocks.kt`) — keyed fact row with a hairline, and
  the surface-2 subject block that heads a write sheet. Promoted from the nasiya slice
  when customers needed the same rows.
- `MetricTile` — a tall stacked card on wide (reserves the subtitle line so a
  `MetricGrid` row stays equal height); a slim ~44dp horizontal row (label +
  subtext left, value right, emphasis kept) on compact. `MetricGrid` lays
  `perRow` separate tile cards per row on wide, but on compact collapses them
  into ONE list-card (`Tokens.card`, radius 16, no border) with the rows split by
  1dp `Tokens.border` dividers — the One UI "list card" look, so a KPI block is
  one tidy card, not N tall ones. Every KPI/summary block uses `MetricGrid`, not a
  hand-rolled `Row` of weighted tiles.
- `EmptyView(compact = true)` — single ~56dp icon+text row (wrap height) for an
  inline card empty state; the default stays full-screen centered.
- `FilterButton` — 40dp filter icon button; a primary-tinted count badge shows only when `activeCount > 0`.
- `SearchFilterRow` — inline search field (weight 1f) + `FilterButton`; no own gutter, aligns to the caller's 16dp screen gutter.
- `FilterSheet` — scrolling bottom sheet: title + optional ghost reset in the header, caller's spaced `content`, full-width close button.
- `ScanConfirmSheet` — a confirmation step between a scan and the action it fires: mono `code`, an optional resolved summary (`title`, `price` via `MoneyText`, status chip) with confirm (primary) + cancel (ghost), or, when `error` is set, the error row with a single close action. Generic — only strings, an optional status label/colour and callbacks; the caller resolves the code and maps the status label/colour (e.g. POS via `DeviceStatusMeta`).
- `listBottomPadding(fab)` — bottom-only `contentPadding` for a scrolling list so its last row clears a FAB (`fab = true` → `Tokens.Space.fabClearance`) or the bottom bar (`fab = false` → `Tokens.Space.listBottom`). Bottom-only on purpose, so callers keep their own horizontal gutter.
- `ScannerField` — HID keyboard-wedge + camera scan input. `onScan: (code: String, fromCamera: Boolean) -> Unit`: `false` for a wedge/typed submit, `true` for a camera detection, so a caller can confirm camera reads but stage wedge scans straight through. Autofocus keeps the field ready for a wedge, but the soft keyboard is actively dismissed on the programmatic focus: `SoftwareKeyboardController.hide()` runs after a 50ms settle in the autofocus effect and again on every `onFocusChanged` while the user has not pressed the field, and `submit()` refocuses + hides so the IME never lingers between scans. The IME comes up only when the user presses the field (a `PressInteraction.Press` on the shared `interactionSource` sets `userTapped` and calls `show()`), so manual entry still works. The hide route is needed because the legacy value/onValueChange `OutlinedTextField` inside a `ModalBottomSheet` ignores `showKeyboardOnFocus` (that flag is still passed as a no-cost extra for newer fields). Verified on emulator via `dumpsys input_method` (`mInputShown=false` on open, `true` after tapping the field). Duplicate scans within 1.2s are dropped.
- `OfflineBanner` — the "you are offline" strip (surface-2 strip radius 12, cloud-off glyph, caller-supplied localized `message`). Pure presentation; the caller decides when `!online`. Used by the login screen and the device-intake sheet.
- `CaptureSpring.kt` — the signature capture spring (DESIGN.md Motion). `rememberCaptureTracker()` + `tracker.isNew(key)` mark only rows that arrive after the screen opens (never the initial set); wrap each row in `CaptureSpringItem(isNew, pulse = list.size, reduceMotion)` and a new row springs in from the scan field (translationY −24 dp, scale 0.96, 350 ms `spring(0.75f, StiffnessMediumLow)`) while the rest dims to 60% for one beat. `rememberReduceMotion()` (reads `ANIMATOR_DURATION_SCALE == 0`) swaps the spring for a 150 ms fade and drops the dim. Used by the POS cart (`PosCartList`) and intake drafts (`IntakeStagedList`). The capture spring is the ONE authored motion; press feedback is the separate `PressIndication`, and there are no entrance animations on screens.
- Haptics live in `shared/lib/Haptics.kt` (platform helper): `rememberHaptics()` → `tick()` (a scan landed — fired once inside `ScannerField`, HID + camera), `success()` (sale/batch completed — CONFIRM twice 120 ms apart), `error()` (duplicate / rejected scan). Built on `View.performHapticFeedback` (honours the system haptic setting); CONFIRM/REJECT with KEYBOARD_TAP/LONG_PRESS fallbacks below API 30.

## Safe-area / inset contract

Edge-to-edge is on (`MainActivity.enableEdgeToEdge()`), so every surface must
reserve the status bar, the gesture / navigation bar and the IME itself.

- **Shell-hosted screens** sit inside `AppShell`'s `Scaffold`; it passes a padded
  `Modifier` that already clears the system bars. Such a screen just uses it and
  does **not** add its own inset padding.
- **Nested `Scaffold`s** inside a shell screen must pass
  `contentWindowInsets = WindowInsets(0)`, or the system bars are padded twice
  (the shell already did it) and a dead gutter appears under the top bar.
- **Screens rendered outside the shell** (login, the bare dev-console route) own
  their inset: wrap in `Modifier.systemBarsPadding()` (+ `imePadding()` when they
  hold focusable fields).
- **Bottom sheets** go through `AppBottomSheet`, which applies
  `navigationBarsPadding().imePadding()` once for all call sites (chained → bottom
  padding is `max(nav bar, keyboard)`, never the sum). A sheet whose body can
  exceed the screen adds its own `verticalScroll`.

## Must never
- Hard-code colours, spacing, radii or type sizes — read `Tokens`.
- Re-apply a system-bar inset a parent already consumed (double gutter).
- Hold business state or know what a "device" / "sale" is.
