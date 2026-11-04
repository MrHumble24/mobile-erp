package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.admin.data.UserDto
import uz.malika.erp.features.admin.model.UsersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens
import uz.malika.erp.ui.theme.MonoFamily

/** Reset a user's password (min 8, confirm must match). Online-only POST. */
@Composable
fun ResetPasswordDialog(usersVm: UsersViewModel, user: UserDto, online: Boolean, onDismiss: () -> Unit) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    var password by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val valid = password.length >= 8 && password == confirm

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
            Text(t("users.resetPassword", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            Text(user.email, style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.muted)
            Spacer(Modifier.height(Tokens.Space.lg))
            AppFormField(
                t("users.newPassword", null), password, { password = it },
                keyboardType = KeyboardType.Password,
                visualTransformation = PasswordVisualTransformation(),
            )
            Spacer(Modifier.height(Tokens.Space.md))
            AppFormField(
                t("users.confirmPassword", null), confirm, { confirm = it },
                keyboardType = KeyboardType.Password,
                visualTransformation = PasswordVisualTransformation(),
            )
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
                text = t("users.resetPassword", null),
                enabled = valid && online && !busy,
                modifier = Modifier.fillMaxWidth(),
                onClick = {
                    busy = true; error = null
                    scope.launch {
                        try {
                            usersVm.resetPassword(user.id, password)
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
