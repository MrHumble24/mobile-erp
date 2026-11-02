package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.launch
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AppException
import uz.malika.erp.features.admin.data.RoleDto
import uz.malika.erp.features.admin.model.AccessViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppConfirmDialog
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/** Roles tab: list, create, rename, delete, and edit a role's permission set. */
@Composable
fun RolesTab(container: AppContainer, accessVm: AccessViewModel) {
    val t = LocalT.current
    val online by container.connectivity.online.collectAsStateWithLifecycle()
    val roles by accessVm.roles.collectAsStateWithLifecycle()
    var createOpen by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<RoleDto?>(null) }
    var permsFor by remember { mutableStateOf<RoleDto?>(null) }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            PillButton(t("users.newRole", null), onClick = { createOpen = true }, enabled = online)
        }
        Spacer(Modifier.height(12.dp))
        AsyncContent(roles, onRetry = accessVm::loadRoles) { list ->
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                list.forEach { role ->
                    RoleCard(
                        role = role,
                        online = online,
                        accessVm = accessVm,
                        onEdit = { editing = role },
                        onPerms = { permsFor = role },
                    )
                }
            }
        }
    }

    if (createOpen) CreateRoleDialog(accessVm, online, onDismiss = { createOpen = false })
    editing?.let { EditRoleDialog(accessVm, it, online, onDismiss = { editing = null }) }
    permsFor?.let { RolePermissionsSheet(accessVm, it, online, onDismiss = { permsFor = null }) }
}

@Composable
private fun RoleCard(
    role: RoleDto,
    online: Boolean,
    accessVm: AccessViewModel,
    onEdit: () -> Unit,
    onPerms: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    var confirmDelete by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    AppCard {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(role.name, style = MaterialTheme.typography.titleMedium)
                    Text(role.code, style = MaterialTheme.typography.bodySmall)
                }
                role.description?.takeIf { it.isNotBlank() }?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall)
                }
                Text(
                    t("users.permissionsCount", null) + ": " + role.permissionCodes.size,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            if (role.isSystem) StatusChip(t("users.systemRole", null), color = Tokens.slate)
        }
        error?.let {
            Spacer(Modifier.height(6.dp))
            Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
        }
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            PillButton(t("users.saveMatrix", null), variant = ButtonVariant.OUTLINE, enabled = online && !role.isSystem, onClick = onPerms)
            PillButton(t("users.editRole", null), variant = ButtonVariant.OUTLINE, enabled = online, onClick = onEdit)
            PillButton(t("common.delete", null), variant = ButtonVariant.DESTRUCTIVE, enabled = online && !role.isSystem, onClick = { confirmDelete = true })
        }
    }

    if (confirmDelete) {
        AppConfirmDialog(
            title = t("common.delete", null),
            message = t("users.confirmDeleteRole", mapOf("role" to role.name)),
            confirmLabel = t("common.delete", null),
            cancelLabel = t("common.cancel", null),
            destructive = true,
            onConfirm = {
                confirmDelete = false
                scope.launch {
                    error = try {
                        accessVm.delete(role.code); null
                    } catch (e: AppException) {
                        // ponytail: scrape the count from the 409 message ("assigned to N user(s)");
                        // upgrade to a structured error field if the envelope ever exposes one.
                        if (e.statusCode == 409) {
                            val count = Regex("\\d+").find(e.message)?.value ?: "0"
                            t("users.roleInUse", mapOf("count" to count))
                        } else {
                            e.message
                        }
                    }
                }
            },
            onDismiss = { confirmDelete = false },
        )
    }
}
