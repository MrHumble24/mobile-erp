package uz.malika.erp.features.admin

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ManageAccounts
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Sync
import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import uz.malika.erp.AppContainer
import uz.malika.erp.app.FeatureModule
import uz.malika.erp.app.NavItem
import uz.malika.erp.app.PermissionGate
import uz.malika.erp.features.admin.ui.SettingsScreen
import uz.malika.erp.features.admin.ui.SyncScreen
import uz.malika.erp.features.admin.ui.UsersScreen

/**
 * Public surface of the Admin & Sync slice group: Users & Access (RBAC),
 * store Settings, and Sync. Nav items are permission-gated by CODE; the sync
 * section is visible to every signed-in user (its conflict inbox is gated
 * inside by `sync.resolve`).
 */
object AdminFeature : FeatureModule {

    override val navItems = listOf(
        NavItem("users", "nav.users", Icons.Outlined.ManageAccounts, permission = "user.manage"),
        NavItem("settings", "nav.settings", Icons.Outlined.Settings, permission = "settings.manage"),
        NavItem("sync", "nav.sync", Icons.Outlined.Sync),
    )

    override fun register(builder: NavGraphBuilder, nav: NavController, container: AppContainer) {
        builder.composable("users") {
            PermissionGate("user.manage") { UsersScreen(container) }
        }
        builder.composable("settings") {
            PermissionGate("settings.manage") { SettingsScreen(container) }
        }
        builder.composable("sync") { SyncScreen(container) }
    }
}
