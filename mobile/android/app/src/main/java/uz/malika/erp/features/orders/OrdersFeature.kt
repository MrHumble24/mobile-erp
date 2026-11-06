package uz.malika.erp.features.orders

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import uz.malika.erp.AppContainer
import uz.malika.erp.app.FeatureModule
import uz.malika.erp.app.NavItem
import uz.malika.erp.app.PermissionGate
import uz.malika.erp.features.orders.data.OrdersApi
import uz.malika.erp.features.orders.data.OrdersRepository
import uz.malika.erp.features.orders.model.OrdersBadge
import uz.malika.erp.features.orders.ui.OrdersScreen

/**
 * Online storefront orders (handoff 029, ADR 0049/0050): one route `orders`,
 * `order.read` to see it, `order.manage` for the status buttons. The nav entry
 * carries a NEW-order badge from [OrdersBadge]. Online only — nothing cached or
 * queued. Scoped to the active store via `X-Store-Id`.
 */
object OrdersFeature : FeatureModule {

    override val navItems = listOf(
        NavItem(
            route = "orders",
            labelKey = "nav.orders",
            icon = Icons.Outlined.ShoppingCart,
            permission = "order.read",
            badge = OrdersBadge.count,
        ),
    )

    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable("orders") {
            PermissionGate("order.read") { OrdersScreen(container) }
        }
    }

    /** Refresh the More-tab badge; called when that tab opens. */
    fun refreshBadge(container: AppContainer) {
        OrdersBadge.refresh(container.appScope, OrdersRepository(container.retrofit.create(OrdersApi::class.java)))
    }
}
