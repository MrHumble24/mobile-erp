# app/ — shell & navigation

The integrator-owned shell. Owns nothing business; builds nav + routes from
feature modules.

## Contract
- **FeatureRegistry**: the one list of `FeatureModule`s + the nav order + start route.
- **FeatureModule / NavItem**: a slice's only surface to the shell (nav entries + route registration).
- **Navigation.kt**: signed-out graph (login + dev panel) vs. authed `AppShell`; filters nav by `user.can()`, wires cross-feature nav (`FeatureNav`) and the `MoreScreen` overflow route.
- **AppShell.kt**: adaptive chrome — a navigation rail on ≥600dp, else a Samsung One UI bottom bar on phones. The top app bar title is the current destination's `labelKey` (`nav.more` on the More page); offline icon + logout live there, no drawer/menu icon.
- **BottomNav.kt**: `OneUiBottomBar` (plain `Tokens.surface`, 1dp hairline, no pill, 5 equal `weight(1f)` columns = first 4 destinations + `More`, single-line ellipsized 11sp labels, nav-bar inset) and `bottomBarSplit` / `MORE_ROUTE`.
- **MoreScreen.kt**: the overflow destinations as one grouped `Tokens.surface` card of icon + label + chevron rows; the More tab stays selected on any overflow route.
- **PermissionGate.kt**: wraps a route; renders a 403 panel when the user lacks the permission.
- **Branch / store switching**: `MoreScreen` displays active store banner at the top; users with >1 store can switch branches with cache clear and repull (ADR 0058).

## Never
- Put business logic or feature-specific code here.
- Re-render the screen title inside feature screens (the shell owns it).

## Warm Card (ADR 0022) — More
- `MoreScreen` is one `AppCard` (padding 0) of 52 dp icon + label + chevron rows split
  by inset hairlines, on the ground with no border; kit tokens only.
