package uz.malika.erp.app

import uz.malika.erp.features.home.HomeFeature

/**
 * ─────────────────────────────────────────────────────────────────────────
 * THE EXTENSION POINT (integrator-owned). To add a feature slice:
 *   1. build it under `features/<slice>/` with one `FeatureModule` object
 *      (see FOUNDATION.md),
 *   2. add ONE line to [features] below: `MyFeature,`.
 * Nothing else in `app/` changes. The shell builds nav + routes from this list,
 * filtering nav items by the user's permissions and gating routes inline.
 * ─────────────────────────────────────────────────────────────────────────
 */
object FeatureRegistry {
    val features: List<FeatureModule> = listOf(
        HomeFeature,
        // ← feature agents append their module here, one line each.
    )

    /** Nav entries from every feature, in registration order. */
    val navItems: List<NavItem> get() = features.flatMap { it.navItems }

    /** The route the shell lands on first. */
    val startRoute: String get() = navItems.firstOrNull()?.route ?: HomeFeature.route
}
