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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import uz.malika.erp.AppContainer
import uz.malika.erp.features.admin.data.RoleDto
import uz.malika.erp.features.admin.model.AccessViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens
import androidx.compose.foundation.layout.width
import uz.malika.erp.ui.theme.MonoFamily

/** Roles tab: list, create, rename, delete, and edit a role's permission set. */
@Composable
fun RolesTab(container: AppContainer, accessVm: AccessViewModel) {
    val t = LocalT.current
    val online by container.connectivity.online.collectAsStateWithLifecycle()
    val roles by accessVm.roles.collectAsStateWithLifecycle()
    var createOpen by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<RoleDto?>(null) }
    var permsFor by remember { mutableStateOf<RoleDto?>(null) }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState())
            .padding(start = Tokens.Space.screenH, end = Tokens.Space.screenH, bottom = Tokens.Space.lg),
        verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg),
    ) {
        PillButton(t("users.newRole", null), onClick = { createOpen = true }, enabled = online, modifier = Modifier.fillMaxWidth())
        AsyncContent(roles, onRetry = accessVm::loadRoles) { list ->
            Column(verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg)) {
                list.forEach { role ->
                    RoleCard(role = role, online = online, onEdit = { editing = role }, onPerms = { permsFor = role })
                }
            }
        }
    }

    if (createOpen) CreateRoleDialog(accessVm, online, onDismiss = { createOpen = false })
    editing?.let { EditRoleDialog(accessVm, it, online, onDismiss = { editing = null }) }
    permsFor?.let { RolePermissionsSheet(accessVm, it, online, onDismiss = { permsFor = null }) }
}

/** One role card: name, mono code, description, permission count; system/custom pill; perms + edit pills. Delete lives in the edit sheet. */
@Composable
private fun RoleCard(role: RoleDto, online: Boolean, onEdit: () -> Unit, onPerms: () -> Unit) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(role.name, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                Text(role.code, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted)
                role.description?.takeIf { it.isNotBlank() }?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                }
                Text(
                    t("users.permissionsCount", null) + ": " + role.permissionCodes.size,
                    style = MaterialTheme.typography.bodySmall,
                    color = Tokens.muted,
                )
            }
            Spacer(Modifier.width(Tokens.Space.gap))
            StatusChip(
                t(if (role.isSystem) "users.systemRole" else "users.customRole", null),
                color = if (role.isSystem) Tokens.sold else Tokens.info,
            )
        }
        Spacer(Modifier.height(Tokens.Space.md))
        Row(horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
            PillButton(t("users.saveMatrix", null), variant = ButtonVariant.SECONDARY, enabled = online && !role.isSystem, onClick = onPerms, modifier = Modifier.weight(1f))
            PillButton(t("users.editRole", null), variant = ButtonVariant.SECONDARY, enabled = online, onClick = onEdit, modifier = Modifier.weight(1f))
        }
    }
}
