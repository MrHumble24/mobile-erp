# shared/ui — stack-level Compose kit

Ink-themed primitives with no business meaning (cards, buttons, fields, chips,
sheets, scanner). Feature screens compose these; colours come from `Tokens.*`
getters and spacing from `Tokens.Space.*` — never ad-hoc literals.

## Component contracts

- `SegmentedControl` — labels are single-line (equal segment heights); when they
  overflow the available width the row auto-fits by dropping one type step
  (labelLarge → bodySmall), ellipsis only as last resort. Never clips; callers
  must not wrap it in `horizontalScroll`.
- `MetricTile` — always reserves the subtitle line, so tiles in a `MetricGrid`
  row stay equal height whether or not they carry a `subtext`.
- `EmptyView(compact = true)` — single ~56dp icon+text row (wrap height) for an
  inline card empty state; the default stays full-screen centered.

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
