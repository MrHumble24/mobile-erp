package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import uz.malika.erp.AppContainer
import uz.malika.erp.features.admin.model.AccessViewModel
import uz.malika.erp.features.admin.model.UsersViewModel
import uz.malika.erp.features.admin.model.adminViewModelFactory
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl

private enum class UsersSection { USERS, ROLES, MATRIX }

/**
 * Users & Access (RBAC): three sections — Users, Roles, Permission matrix —
 * switched by a segmented control. The users and access ViewModels are hoisted
 * here so every section and its dialogs share one source of roles/permissions.
 */
@Composable
fun UsersScreen(container: AppContainer) {
    val t = LocalT.current
    val factory = remember(container) { adminViewModelFactory(container) }
    val usersVm: UsersViewModel = viewModel(factory = factory)
    val accessVm: AccessViewModel = viewModel(factory = factory)
    var section by remember { mutableStateOf(UsersSection.USERS) }

    Column(Modifier.fillMaxSize()) {
        SegmentedControl(
            options = listOf(
                SegmentOption(UsersSection.USERS, t("users.tabUsers", null)),
                SegmentOption(UsersSection.ROLES, t("users.tabRoles", null)),
                SegmentOption(UsersSection.MATRIX, t("users.tabPermissions", null)),
            ),
            selected = section,
            onSelect = { section = it },
            modifier = Modifier.padding(16.dp),
        )
        when (section) {
            UsersSection.USERS -> UsersTab(container, usersVm, accessVm)
            UsersSection.ROLES -> RolesTab(container, accessVm)
            UsersSection.MATRIX -> PermissionMatrixTab(accessVm)
        }
    }
}
