package uz.malika.erp.features.purchases

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ShoppingBag
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import uz.malika.erp.AppContainer
import uz.malika.erp.app.FeatureModule
import uz.malika.erp.app.NavItem
import uz.malika.erp.app.PermissionGate
import uz.malika.erp.features.purchases.ui.PurchasesScreen

/**
 * Buying used phones from customers (Change 14, ADR 0039): the purchases list +
 * "Buy a phone" sheet. One route (`purchases`, perm `purchase.read`). The till's
 * trade-in reuses this slice's `UsedUnitFields`. Online only.
 */
object PurchasesFeature : FeatureModule {

    override val navItems = listOf(
        NavItem(route = "purchases", labelKey = "nav.purchases", icon = Icons.Outlined.ShoppingBag, permission = "purchase.read"),
    )

    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable("purchases") {
            PermissionGate("purchase.read") { PurchasesScreen(container) }
        }
    }
}
