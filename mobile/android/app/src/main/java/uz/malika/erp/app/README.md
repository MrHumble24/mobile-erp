# app/ — shell & navigation

The integrator-owned shell. Owns nothing business; builds nav + routes from
feature modules.

## Contract
- **FeatureRegistry**: the one list of `FeatureModule`s + the nav order + start route.
- **FeatureModule / NavItem**: a slice's only surface to the shell (nav entries + route registration).
- **Navigation.kt**: signed-out graph (login + dev panel) vs. authed `AppShell`; filters nav by `user.can()` and wires cross-feature nav (`FeatureNav`).
- **AppShell.kt**: adaptive chrome — a navigation rail on ≥600dp, else a hamburger `ModalNavigationDrawer` on phones (a bottom tab bar overflows with 14 destinations). The top app bar title is the current destination's `labelKey`; the offline icon, logout action and (phones) the drawer menu icon live there. Drawer colours come from `Tokens`.
- **PermissionGate.kt**: wraps a route; renders a 403 panel when the user lacks the permission.

## Never
- Put business logic or feature-specific code here.
- Re-render the screen title inside feature screens (the shell owns it).
