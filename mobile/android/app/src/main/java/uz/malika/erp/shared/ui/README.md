# shared/ui — stack-level Compose kit

Ink-themed primitives with no business meaning (cards, buttons, fields, chips,
sheets, scanner). Feature screens compose these; colours come from `Tokens.*`
getters and spacing from `Tokens.Space.*` — never ad-hoc literals.

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

- `SegmentedControl` — labels are single-line (equal segment heights); when they
  overflow the available width the row auto-fits by dropping one type step
  (labelLarge → bodySmall), ellipsis only as last resort. Never clips; callers
  must not wrap it in `horizontalScroll`.
- `MetricTile` — a tall stacked card on wide (reserves the subtitle line so a
  `MetricGrid` row stays equal height); a slim ~44dp horizontal row (label +
  subtext left, value right, emphasis kept) on compact. `MetricGrid` lays
  `perRow` separate tile cards per row on wide, but on compact collapses them
  into ONE list-card (`Tokens.surfaceCanvas`, hairline border, radius 12) with
  the rows split by 1dp `Tokens.hairline` dividers — the One UI "list card"
  look, so a KPI block is one tidy card, not N tall ones. Every KPI/summary
  block uses `MetricGrid`, not a hand-rolled `Row` of weighted tiles.
- `EmptyView(compact = true)` — single ~56dp icon+text row (wrap height) for an
  inline card empty state; the default stays full-screen centered.
- `FilterButton` — 40dp filter icon button; a primary-tinted count badge shows only when `activeCount > 0`.
- `SearchFilterRow` — inline search field (weight 1f) + `FilterButton`; no own gutter, aligns to the caller's 16dp screen gutter.
- `FilterSheet` — scrolling bottom sheet: title + optional ghost reset in the header, caller's spaced `content`, full-width close button.
- `ScanConfirmSheet` — a confirmation step between a scan and the action it fires: mono `code`, an optional resolved summary (`title`, `price` via `MoneyText`, status chip) with confirm (primary) + cancel (ghost), or, when `error` is set, the error row with a single close action. Generic — only strings, an optional status label/colour and callbacks; the caller resolves the code and maps the status label/colour (e.g. POS via `DeviceStatusMeta`).
- `listBottomPadding(fab)` — bottom-only `contentPadding` for a scrolling list so its last row clears a FAB (`fab = true` → `Tokens.Space.fabClearance`) or the bottom bar (`fab = false` → `Tokens.Space.listBottom`). Bottom-only on purpose, so callers keep their own horizontal gutter.

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
