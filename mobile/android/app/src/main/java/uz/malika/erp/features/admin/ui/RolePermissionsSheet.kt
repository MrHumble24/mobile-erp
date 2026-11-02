package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.admin.data.RoleDto
import uz.malika.erp.features.admin.model.AccessViewModel
import uz.malika.erp.features.admin.model.Async
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** Checkbox grid of all permissions (grouped by resource) for one role. Save replaces. */
@Composable
fun RolePermissionsSheet(accessVm: AccessViewModel, role: RoleDto, online: Boolean, onDismiss: () -> Unit) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val permissions by accessVm.permissions.collectAsStateWithLifecycle()
    val selected = remember(role.code) { mutableStateMapOf<String, Boolean>().apply { role.permissionCodes.forEach { put(it, true) } } }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.padding(16.dp)) {
            Text(role.name, style = MaterialTheme.typography.titleMedium)
            Text(role.code, style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(12.dp))

            val perms = (permissions as? Async.Ok)?.value.orEmpty()
            Column(Modifier.heightIn(max = 380.dp).verticalScroll(rememberScrollState())) {
                perms.groupBy { it.resource }.forEach { (resource, group) ->
                    Text(resource.uppercase(), style = MaterialTheme.typography.labelLarge, modifier = Modifier.padding(top = 8.dp, bottom = 4.dp))
                    group.forEach { p ->
                        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                            AdminCheckbox(
                                checked = selected[p.code] == true,
                                onCheckedChange = { on -> selected[p.code] = on },
                            )
                            Column {
                                Text(p.code, style = MaterialTheme.typography.bodyMedium)
                                p.description?.takeIf { it.isNotBlank() }?.let {
                                    Text(it, style = MaterialTheme.typography.bodySmall)
                                }
                            }
                        }
                    }
                }
            }
            if (error != null) {
                Spacer(Modifier.height(8.dp))
                Text(error!!, style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
            }
            if (!online) {
                Spacer(Modifier.height(8.dp))
                Text(t("common.offline", null), style = MaterialTheme.typography.bodySmall, color = Tokens.slate)
            }
            Spacer(Modifier.height(12.dp))
            PillButton(
                text = t("users.saveMatrix", null),
                enabled = online && !busy,
                modifier = Modifier.fillMaxWidth(),
                onClick = {
                    busy = true; error = null
                    val codes = selected.filterValues { it }.keys.toList()
                    scope.launch {
                        try {
                            accessVm.setPermissions(role.code, codes)
                            onDismiss()
                        } catch (e: AppException) {
                            error = e.message
                        } finally {
                            busy = false
                        }
                    }
                },
            )
        }
    }
}
