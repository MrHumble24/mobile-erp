package uz.malika.erp.features.stock

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Warehouse
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import uz.malika.erp.AppContainer
import uz.malika.erp.app.FeatureModule
import uz.malika.erp.app.NavItem
import uz.malika.erp.app.PermissionGate
import uz.malika.erp.features.stock.data.StockApi
import uz.malika.erp.features.stock.ui.StockScreen

/**
 * Quantity-product stock slice (ADR 0030): the stock list (search + category),
 * each product's movement log, and — with `stock.adjust` — write-off and count
 * correction. One nav item gated by `device.read`.
 *
 * Integrator: add `StockFeature,` to `FeatureRegistry.features`.
 */
object StockFeature : FeatureModule {
    const val route = "stock"

    @Volatile private var apiRef: StockApi? = null
    private fun api(c: AppContainer): StockApi =
        apiRef ?: c.retrofit.create(StockApi::class.java).also { apiRef = it }

    override val navItems = listOf(
        NavItem(route = route, labelKey = "nav.stock", icon = Icons.Outlined.Warehouse, permission = "device.read"),
    )

    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable(route) {
            PermissionGate("device.read") { StockScreen(container, api(container)) }
        }
    }
}
