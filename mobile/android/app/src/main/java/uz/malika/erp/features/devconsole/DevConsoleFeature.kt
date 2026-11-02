package uz.malika.erp.features.devconsole

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.DeveloperMode
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import uz.malika.erp.AppContainer
import uz.malika.erp.app.FeatureModule
import uz.malika.erp.app.NavItem
import uz.malika.erp.features.devconsole.ui.DevConsoleScreen

/** The nav route id for the Developer Console (shared by the shell's dev entry). */
const val DEV_CONSOLE_ROUTE = "devconsole"

// A bareword label (no "ns.key" dot) is returned verbatim by the i18n loader, so
// this stays English without touching the shared client JSON.
/** The dev-console nav entry, shown by the shell only when [DevAccess] is unlocked. */
val devConsoleNavItem = NavItem(DEV_CONSOLE_ROUTE, "Developer", devIcon())

private fun devIcon(): ImageVector = Icons.Outlined.DeveloperMode

/**
 * Registers the Developer Console route. It is NOT RBAC-gated: visibility is a
 * build/session rule (debug: always; release: after the access code), handled by
 * [DevAccess] and the shell — so [navItems] is empty and the shell adds the entry.
 */
object DevConsoleFeature : FeatureModule {

    override val navItems: List<NavItem> = emptyList()

    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable(DEV_CONSOLE_ROUTE) {
            DevConsoleScreen(container, onClose = { nav.popBackStack() })
        }
    }
}
