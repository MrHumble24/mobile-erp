package uz.malika.erp.features.repairs

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Build
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import uz.malika.erp.AppContainer
import uz.malika.erp.app.FeatureModule
import uz.malika.erp.app.NavItem
import uz.malika.erp.app.PermissionGate
import uz.malika.erp.features.repairs.ui.RepairsScreen

/**
 * Repairs slice (Change 13, ADR 0040): tickets, parts, money, status machine and
 * the finance report. One route (`repairs`, perm `repair.read`, ADMIN-only by
 * default). The setting `repairsEnabled` gates the screen: every `/repairs` route
 * answers 403 `REPAIRS_DISABLED` when off, and the screen then shows an off state.
 * Online only.
 */
object RepairsFeature : FeatureModule {

    override val navItems = listOf(
        NavItem(route = "repairs", labelKey = "repairs.navTitle", icon = Icons.Outlined.Build, permission = "repair.read"),
    )

    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable("repairs") {
            PermissionGate("repair.read") { RepairsScreen(container) }
        }
    }
}
