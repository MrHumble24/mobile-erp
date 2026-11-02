package uz.malika.erp.features.finance

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material.icons.outlined.ReceiptLong
import androidx.compose.material.icons.outlined.SpaceDashboard
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import uz.malika.erp.AppContainer
import uz.malika.erp.app.FeatureModule
import uz.malika.erp.app.NavItem
import uz.malika.erp.app.PermissionGate
import uz.malika.erp.features.finance.ui.dashboard.DashboardScreen
import uz.malika.erp.features.finance.ui.expenses.ExpensesScreen
import uz.malika.erp.features.finance.ui.reports.ReportsScreen

/**
 * Finance & dashboard slice group: dashboard (auth-only, self-gated sections),
 * expenses (`expense.read`) and reports (`report.finance`). The integrator
 * appends `FinanceFeature,` to `FeatureRegistry.features` and sets the shell's
 * start destination to `dashboard`.
 */
object FinanceFeature : FeatureModule {

    override val navItems = listOf(
        NavItem(route = "dashboard", labelKey = "nav.dashboard", icon = Icons.Outlined.SpaceDashboard),
        NavItem(route = "expenses", labelKey = "nav.expenses", icon = Icons.Outlined.ReceiptLong, permission = "expense.read"),
        NavItem(route = "reports", labelKey = "nav.reports", icon = Icons.Outlined.BarChart, permission = "report.finance"),
    )

    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable("dashboard") {
            // Quick actions open other slices' routes through container.featureNav.
            DashboardScreen(container)
        }
        builder.composable("expenses") {
            PermissionGate("expense.read") { ExpensesScreen(container) }
        }
        builder.composable("reports") {
            PermissionGate("report.finance") { ReportsScreen(container) }
        }
    }
}
