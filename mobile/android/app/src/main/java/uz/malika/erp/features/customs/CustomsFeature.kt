package uz.malika.erp.features.customs

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ReceiptLong
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import uz.malika.erp.AppContainer
import uz.malika.erp.app.FeatureModule
import uz.malika.erp.app.NavItem
import uz.malika.erp.app.PermissionGate
import uz.malika.erp.features.customs.ui.CustomsScreen

/**
 * Customs price-list slice (ADR 0027): the current list per model code, its
 * versions, the models still missing a fee, and a new-list sheet. One route
 * (`customs`, perm `customs.read`) in the finance nav group next to balance;
 * writing needs `customs.manage`. The integrator appends `CustomsFeature,` to
 * `FeatureRegistry.features` and places `customs` after `balance` in `navOrder`.
 */
object CustomsFeature : FeatureModule {

    override val navItems = listOf(
        NavItem(route = "customs", labelKey = "nav.customs", icon = Icons.Outlined.ReceiptLong, permission = "customs.read"),
    )

    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable("customs") {
            PermissionGate("customs.read") { CustomsScreen(container) }
        }
    }
}
