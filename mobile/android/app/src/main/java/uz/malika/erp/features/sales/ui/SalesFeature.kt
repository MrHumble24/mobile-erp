package uz.malika.erp.features.sales.ui

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ReceiptLong
import androidx.compose.material.icons.outlined.People
import androidx.compose.material.icons.outlined.PointOfSale
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import uz.malika.erp.AppContainer
import uz.malika.erp.app.FeatureModule
import uz.malika.erp.app.NavItem
import uz.malika.erp.app.PermissionGate
import uz.malika.erp.features.sales.data.SalesApi

/**
 * The POS & Sales slice group: POS checkout (offline-capable), the sales list +
 * warranty lookup + returns, and the customer directory. One module, three
 * permission-gated routes. The slice-local [SalesApi] (see its builder note)
 * is created once and shared by the three screens' ViewModels.
 */
object SalesFeature : FeatureModule {

    @Volatile private var apiRef: SalesApi? = null
    private fun api(c: AppContainer): SalesApi =
        apiRef ?: c.retrofit.create(SalesApi::class.java).also { apiRef = it }

    override val navItems = listOf(
        NavItem(route = "pos", labelKey = "nav.pos", icon = Icons.Outlined.PointOfSale, permission = "sale.create"),
        NavItem(route = "sales", labelKey = "nav.sales", icon = Icons.AutoMirrored.Outlined.ReceiptLong, permission = "sale.read"),
        NavItem(route = "customers", labelKey = "sales.customersTitle", icon = Icons.Outlined.People, permission = "customer.read"),
    )

    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable("pos") {
            PermissionGate("sale.create") { PosScreen(container, api(container)) }
        }
        builder.composable("sales") {
            PermissionGate("sale.read") { SalesScreen(container, api(container)) }
        }
        builder.composable("customers") {
            PermissionGate("customer.read") { CustomersScreen(container, api(container)) }
        }
    }
}
