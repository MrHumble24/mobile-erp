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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.admin.data.ProfileBody
import uz.malika.erp.features.admin.data.UserDto
import uz.malika.erp.features.admin.model.UsersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** Edit a user's profile (firstName / lastName / phone / telegram). Online-only PATCH. */
@Composable
fun UserProfileSection(usersVm: UsersViewModel, user: UserDto, online: Boolean) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val p = user.profile
    var firstName by remember(user.id) { mutableStateOf(p?.firstName ?: "") }
    var lastName by remember(user.id) { mutableStateOf(p?.lastName ?: "") }
    var phone by remember(user.id) { mutableStateOf(p?.phone ?: "") }
    var telegram by remember(user.id) { mutableStateOf(p?.telegramHandle ?: "") }
    var busy by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    var isError by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxWidth()) {
        AppFormField(t("users.firstName", null), firstName, { firstName = it })
        Spacer(Modifier.height(Tokens.Space.md))
        AppFormField(t("users.lastName", null), lastName, { lastName = it })
        Spacer(Modifier.height(Tokens.Space.md))
        AppFormField(t("common.phone", null), phone, { phone = it }, keyboardType = KeyboardType.Phone)
        Spacer(Modifier.height(Tokens.Space.md))
        AppFormField(t("users.telegramHandle", null), telegram, { telegram = it })
        if (message != null) {
            Spacer(Modifier.height(Tokens.Space.sm))
            Text(message!!, style = MaterialTheme.typography.bodySmall, color = if (isError) Tokens.danger else Tokens.success)
        }
        if (!online) {
            Spacer(Modifier.height(Tokens.Space.sm))
            Text(t("common.offline", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        }
        Spacer(Modifier.height(Tokens.Space.lg))
        PillButton(
            text = t("users.saveProfile", null),
            enabled = online && !busy && firstName.isNotBlank(),
            modifier = Modifier.fillMaxWidth(),
            onClick = {
                busy = true; message = null
                scope.launch {
                    try {
                        usersVm.updateProfile(
                            user.id,
                            ProfileBody(
                                firstName = firstName.trim(),
                                lastName = lastName.trim().ifBlank { null },
                                phone = phone.trim().ifBlank { null },
                                telegramHandle = telegram.trim().ifBlank { null },
                            ),
                        )
                        isError = false; message = t("users.profileSaved", null)
                    } catch (e: AppException) {
                        isError = true; message = e.message
                    } finally {
                        busy = false
                    }
                }
            },
        )
    }
}
