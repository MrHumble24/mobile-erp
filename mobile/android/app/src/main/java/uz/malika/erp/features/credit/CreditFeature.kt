package uz.malika.erp.features.credit

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CreditCard
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import uz.malika.erp.AppContainer
import uz.malika.erp.app.FeatureModule
import uz.malika.erp.app.NavItem
import uz.malika.erp.app.PermissionGate
import uz.malika.erp.features.credit.ui.CreditsScreen

/**
 * Customer credit slice (Change 6, ADR 0035): the credits list + detail, the
 * till's "On credit" sheet and the customer form field live here. One route
 * (`credits`, perm `sale.read`) in the finance nav group. Online only — credit
 * never queues through sync.
 */
object CreditFeature : FeatureModule {

    override val navItems = listOf(
        NavItem(route = "credits", labelKey = "nav.credits", icon = Icons.Outlined.CreditCard, permission = "sale.read"),
    )

    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable("credits") {
            PermissionGate("sale.read") { CreditsScreen(container) }
        }
    }
}
