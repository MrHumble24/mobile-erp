# features/devconsole — Developer Console

A build/session-gated developer panel, reached from the sign-in screen's
"Developer settings" button (and, once unlocked, a shell nav entry).

## Owns
- **Gate** (`DevAccess`): debug builds always open; release builds unlock only
  after the access code is entered this session (process lifetime, no persist).
  A convenience gate, not a security boundary — anything sensitive stays server-side.
- **Console** (route `devconsole`): one section at a time from
  `DevConsoleSections.all`, picked by a segmented selector. English-only by design.
  Sections: Quick Login, Environment, Network, Logs.
- **Quick Login** (`QuickLoginSection` + `DevAccounts`): one-tap sign-in fillers
  for the seeded local-dev accounts (owner / cashier / qc). Tapping a preset hands
  its credentials to `DevQuickLogin`; the console closes and the sign-in screen
  fills its email/password when it reappears.

## Public API
- `DevConsoleFeature : FeatureModule`, `devConsoleNavItem`, `DEV_CONSOLE_ROUTE`.
- `DevAccess` (unlock/visibility), `DevConsoleSections.all` (add a section = one
  new file + one entry here).
- `DevQuickLogin` (one-shot credential carrier read by the auth sign-in screen).

## Theming
- All colour comes from adaptive `Tokens.*` getters (no literal `Color(...)` or
  brand palette): screen background `Tokens.background`, cards via `AppCard`
  (`surface` + `hairline`), text `foreground`/`mutedForeground`. Role badges map
  owner→`accent`/`surface2`, cashier→`success`/`successBg`, qc→`info`/`infoBg`
  (`roleBadgeColors`); log/network levels map to `success`/`warning`/`danger`/`info`.

## Must never
- Act as a security boundary — the gate is convenience only.
- Persist dev credentials or the gate state across process restarts.
- Add a second gate mechanism; everything here lives behind `DevAccess`.
