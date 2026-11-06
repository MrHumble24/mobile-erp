package uz.malika.erp.app

import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import kotlinx.coroutines.flow.StateFlow
import uz.malika.erp.AppContainer

/**
 * One entry in the app's navigation. Features declare their own in their
 * `FeatureModule`. The shell renders the items the user `can()` see, in order.
 */
data class NavItem(
    /** Navigation route, e.g. "inventory". */
    val route: String,
    /** i18n key, e.g. "nav.inventory". */
    val labelKey: String,
    val icon: ImageVector,
    /** Permission code required to see/enter this section; null = always. */
    val permission: String? = null,
    /** Optional badge count flow (e.g. unhandled orders); null = no badge. */
    val badge: StateFlow<Int>? = null,
)

/**
 * A feature slice's single public surface to the app shell. Each slice exposes
 * ONE `FeatureModule` object and is registered with ONE line in [FeatureRegistry].
 *
 * - [navItems]: nav entries this feature contributes (may be empty for a feature
 *   mounted as a tab inside another).
 * - [register]: adds this feature's composable route(s) to the shell's NavHost.
 *   A route needing a permission wraps its screen in `PermissionGate(code) { ... }`.
 */
interface FeatureModule {
    val navItems: List<NavItem>
    fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer)
}
