package uz.malika.erp.features.shifts

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Schedule
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import uz.malika.erp.AppContainer
import uz.malika.erp.app.FeatureModule
import uz.malika.erp.app.NavItem
import uz.malika.erp.app.PermissionGate
import uz.malika.erp.features.shifts.ui.ShiftsScreen

/**
 * Cashier shifts slice (Change 11, ADR 0036): the till's shift bar + selling gate
 * live in the sales screen; this owns the shifts list route (`shifts`, perm
 * `sale.read`) in the finance nav group. Online only.
 */
object ShiftsFeature : FeatureModule {

    override val navItems = listOf(
        NavItem(route = "shifts", labelKey = "nav.shifts", icon = Icons.Outlined.Schedule, permission = "sale.read"),
    )

    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable("shifts") {
            PermissionGate("sale.read") { ShiftsScreen(container) }
        }
    }
}
