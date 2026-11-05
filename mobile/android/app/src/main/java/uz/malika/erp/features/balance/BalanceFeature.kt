package uz.malika.erp.features.balance

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import uz.malika.erp.AppContainer
import uz.malika.erp.app.FeatureModule
import uz.malika.erp.app.NavItem
import uz.malika.erp.app.PermissionGate
import uz.malika.erp.features.balance.ui.BalanceScreen

/**
 * Store-balance slice: the cash/card accounts, their total and every ledger
 * movement, plus the owner's manual entries. One route (`balance`, perm
 * `balance.read`) in the finance nav group next to expenses. The integrator
 * appends `BalanceFeature,` to `FeatureRegistry.features` and places `balance`
 * after `expenses` in `navOrder`.
 */
object BalanceFeature : FeatureModule {

    override val navItems = listOf(
        NavItem(route = "balance", labelKey = "nav.balance", icon = Icons.Outlined.AccountBalanceWallet, permission = "balance.read"),
    )

    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable("balance") {
            PermissionGate("balance.read") { BalanceScreen(container) }
        }
    }
}
