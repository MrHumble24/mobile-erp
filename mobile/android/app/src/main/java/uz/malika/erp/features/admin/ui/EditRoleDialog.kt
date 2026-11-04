package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.admin.data.RoleDto
import uz.malika.erp.features.admin.model.AccessViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import uz.malika.erp.shared.ui.AppConfirmDialog
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.SubjectBlock

/** Rename a role (name + description). The code is immutable. Online-only PATCH. */
@Composable
fun EditRoleDialog(accessVm: AccessViewModel, role: RoleDto, online: Boolean, onDismiss: () -> Unit) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    var name by remember { mutableStateOf(role.name) }
    var description by remember { mutableStateOf(role.description ?: "") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var confirmDelete by remember { mutableStateOf(false) }
    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
            Text(t("users.editRole", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            Spacer(Modifier.height(Tokens.Space.lg))
            SubjectBlock(t("users.roleCode", null), role.code)
            Spacer(Modifier.height(Tokens.Space.lg))
            AppFormField(t("users.roleName", null), name, { name = it })
            Spacer(Modifier.height(Tokens.Space.md))
            AppFormField(t("users.description", null), description, { description = it })
            if (error != null) {
                Spacer(Modifier.height(Tokens.Space.sm))
                Text(error!!, style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
            }
            if (!online) {
                Spacer(Modifier.height(Tokens.Space.sm))
                Text(t("common.offline", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            }
            Spacer(Modifier.height(Tokens.Space.lg))
            PillButton(
                text = t("common.save", null),
                enabled = name.isNotBlank() && online && !busy,
                modifier = Modifier.fillMaxWidth(),
                onClick = {
                    busy = true; error = null
                    scope.launch {
                        try {
                            accessVm.rename(role.code, name.trim(), description.trim())
                            onDismiss()
                        } catch (e: AppException) {
                            error = e.message
                        } finally {
                            busy = false
                        }
                    }
                },
            )
            Spacer(Modifier.height(Tokens.Space.sm))
            if (role.isSystem) {
                Text(t("users.systemRoleLocked", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            } else {
                PillButton(
                    text = t("common.delete", null),
                    variant = ButtonVariant.DESTRUCTIVE,
                    enabled = online && !busy,
                    modifier = Modifier.fillMaxWidth(),
                    onClick = { confirmDelete = true },
                )
            }
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
                    try {
                        accessVm.delete(role.code)
                        onDismiss()
                    } catch (e: AppException) {
                        // ponytail: scrape the count from the 409 message ("assigned to N user(s)");
                        // upgrade to a structured error field if the envelope ever exposes one.
                        error = if (e.statusCode == 409) {
                            t("users.roleInUse", mapOf("count" to (Regex("\\d+").find(e.message)?.value ?: "0")))
                        } else e.message
                    }
                }
            },
            onDismiss = { confirmDelete = false },
        )
    }
}
