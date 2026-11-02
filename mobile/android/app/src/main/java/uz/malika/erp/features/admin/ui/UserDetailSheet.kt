package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AppException
import uz.malika.erp.features.admin.data.UserDto
import uz.malika.erp.features.admin.data.currentUserId
import uz.malika.erp.features.admin.model.AccessViewModel
import uz.malika.erp.features.admin.model.UsersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens

private enum class DetailSection { PROFILE, ROLES, PERMISSIONS }

/**
 * User detail sheet: status actions (activate/deactivate + reset password) and
 * profile / roles / permission-override editors. An admin cannot deactivate,
 * re-role or re-permission their own account (self-lock, mirrors the web).
 */
@Composable
fun UserDetailSheet(
    container: AppContainer,
    usersVm: UsersViewModel,
    accessVm: AccessViewModel,
    user: UserDto,
    online: Boolean,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val isSelf = remember(user.id) { currentUserId(container) == user.id }
    var section by remember { mutableStateOf(DetailSection.PROFILE) }
    var resetOpen by remember { mutableStateOf(false) }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.padding(16.dp)) {
            Text(user.displayName, style = MaterialTheme.typography.titleMedium)
            Text(user.email, style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(12.dp))

            StatusActions(usersVm, user, isSelf, online, onResetPassword = { resetOpen = true })
            Spacer(Modifier.height(16.dp))

            SegmentedControl(
                options = listOf(
                    SegmentOption(DetailSection.PROFILE, t("users.tabProfile", null)),
                    SegmentOption(DetailSection.ROLES, t("users.roles", null)),
                    SegmentOption(DetailSection.PERMISSIONS, t("users.tabOverrides", null)),
                ),
                selected = section,
                onSelect = { section = it },
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(16.dp))

            when (section) {
                DetailSection.PROFILE -> UserProfileSection(usersVm, user, online)
                DetailSection.ROLES -> UserRolesSection(usersVm, accessVm, user, isSelf, online)
                DetailSection.PERMISSIONS -> UserOverridesSection(usersVm, accessVm, user, isSelf, online)
            }
        }
    }

    if (resetOpen) {
        ResetPasswordDialog(usersVm, user, online, onDismiss = { resetOpen = false })
    }
}

@Composable
private fun StatusActions(
    usersVm: UsersViewModel,
    user: UserDto,
    isSelf: Boolean,
    online: Boolean,
    onResetPassword: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        PillButton(
            text = if (user.isActive) t("users.deactivate", null) else t("users.reactivate", null),
            variant = if (user.isActive) ButtonVariant.DESTRUCTIVE else ButtonVariant.OUTLINE,
            // self-lock: cannot deactivate your own active account
            enabled = online && !busy && !(isSelf && user.isActive),
            onClick = {
                busy = true; error = null
                scope.launch {
                    try {
                        usersVm.setActive(user.id, !user.isActive)
                    } catch (e: AppException) {
                        error = e.message
                    } finally {
                        busy = false
                    }
                }
            },
        )
        PillButton(
            text = t("users.resetPassword", null),
            variant = ButtonVariant.OUTLINE,
            enabled = online,
            onClick = onResetPassword,
        )
    }
    if (error != null) {
        Spacer(Modifier.height(6.dp))
        Text(error!!, style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
    }
}
