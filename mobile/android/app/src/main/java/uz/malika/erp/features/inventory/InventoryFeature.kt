package uz.malika.erp.features.inventory

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Inventory2
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import uz.malika.erp.AppContainer
import uz.malika.erp.app.FeatureModule
import uz.malika.erp.app.NavItem
import uz.malika.erp.app.PermissionGate
import uz.malika.erp.features.inventory.ui.InventoryScreen

/**
 * Inventory slice group: devices (offline list / filters / detail / edit /
 * manual status), device models + attributes, and stock-alert rules + low-stock.
 * One nav item gated by `device.read`; the Models tab needs `device.update`,
 * alert-rule writes need `settings.manage` (enforced inside the screen).
 *
 * Integrator: add `InventoryFeature,` to `FeatureRegistry.features`.
 */
object InventoryFeature : FeatureModule {
    const val route = "inventory"

    override val navItems = listOf(
        NavItem(
            route = route,
            labelKey = "nav.inventory",
            icon = Icons.Outlined.Inventory2,
            permission = "device.read",
        ),
    )

    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable(route) {
            PermissionGate("device.read") { InventoryScreen(container) }
        }
    }
}
