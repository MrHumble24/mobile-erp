package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
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
import uz.malika.erp.features.admin.data.UserDto
import uz.malika.erp.features.admin.model.AccessViewModel
import uz.malika.erp.features.admin.model.UsersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** Reassign a user's roles. Self-lock: cannot change your own roles. Online-only. */
@Composable
fun UserRolesSection(
    usersVm: UsersViewModel,
    accessVm: AccessViewModel,
    user: UserDto,
    isSelf: Boolean,
    online: Boolean,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val selected = remember(user.id) { mutableStateOf(user.roles.toSet()) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    Column(Modifier.fillMaxWidth()) {
        if (isSelf) {
            Text(t("users.selfRolesLocked", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            Spacer(Modifier.height(Tokens.Space.sm))
        }
        RoleCheckboxes(accessVm, selected.value, onToggle = { c ->
            if (!isSelf) {
                selected.value = if (selected.value.contains(c)) selected.value - c else selected.value + c
            }
        })
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
            text = t("users.saveRoles", null),
            enabled = online && !busy && !isSelf,
            modifier = Modifier.fillMaxWidth(),
            onClick = {
                busy = true; error = null
                scope.launch {
                    try {
                        usersVm.setRoles(user.id, selected.value.toList())
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
