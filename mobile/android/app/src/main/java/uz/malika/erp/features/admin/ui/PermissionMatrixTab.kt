package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import uz.malika.erp.features.admin.data.PermissionDto
import uz.malika.erp.features.admin.data.RoleDto
import uz.malika.erp.features.admin.model.AccessViewModel
import uz.malika.erp.features.admin.model.Async
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppDataTable
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.Loading

/** Read-only roles × permissions grid; a cell is checked when the role carries it. */
@Composable
fun PermissionMatrixTab(accessVm: AccessViewModel) {
    val t = LocalT.current
    val rolesState by accessVm.roles.collectAsStateWithLifecycle()
    val permsState by accessVm.permissions.collectAsStateWithLifecycle()

    if (rolesState is Async.Loading || permsState is Async.Loading) {
        Loading(); return
    }
    val roles = (rolesState as? Async.Ok<List<RoleDto>>)?.value.orEmpty()
    val perms = (permsState as? Async.Ok<List<PermissionDto>>)?.value.orEmpty()
    if (perms.isEmpty()) {
        EmptyView(t("common.notFound", null)); return
    }

    AppDataTable(
        columns = listOf(t("users.tabPermissions", null)) + roles.map { it.code },
        rows = perms,
        columnWidths = listOf(220) + roles.map { 90 },
        cell = { perm, col ->
            if (col == 0) perm.code
            else if (roles[col - 1].permissionCodes.contains(perm.code)) "✓" else "—"
        },
        modifier = Modifier.fillMaxSize().padding(16.dp),
        stackOnCompact = false,
    )
}
