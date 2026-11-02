package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.admin.data.CreateUserBody
import uz.malika.erp.features.admin.data.ProfileBody
import uz.malika.erp.features.admin.model.AccessViewModel
import uz.malika.erp.features.admin.model.UsersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** Create-user form in a themed sheet. Online-only write. */
@Composable
fun CreateUserDialog(
    accessVm: AccessViewModel,
    usersVm: UsersViewModel,
    online: Boolean,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()

    var firstName by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    val roles = remember { mutableStateOf(emptySet<String>()) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val valid = firstName.isNotBlank() && email.isNotBlank() && password.length >= 8

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.padding(16.dp).verticalScroll(rememberScrollState())) {
            Text(t("users.newUser", null), style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(16.dp))
            AppFormField(t("users.fullName", null), firstName, { firstName = it })
            Spacer(Modifier.height(12.dp))
            AppFormField(t("common.phone", null), phone, { phone = it }, placeholder = "+99890...", keyboardType = KeyboardType.Phone)
            Spacer(Modifier.height(12.dp))
            AppFormField(t("users.email", null), email, { email = it }, keyboardType = KeyboardType.Email)
            Spacer(Modifier.height(12.dp))
            AppFormField(
                t("users.password", null), password, { password = it },
                keyboardType = KeyboardType.Password,
                visualTransformation = PasswordVisualTransformation(),
            )
            Spacer(Modifier.height(16.dp))
            RoleCheckboxes(accessVm, roles.value, onToggle = { c ->
                roles.value = if (roles.value.contains(c)) roles.value - c else roles.value + c
            })
            if (error != null) {
                Spacer(Modifier.height(8.dp))
                Text(error!!, style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
            }
            if (!online) {
                Spacer(Modifier.height(8.dp))
                Text(t("common.offline", null), style = MaterialTheme.typography.bodySmall, color = Tokens.slate)
            }
            Spacer(Modifier.height(16.dp))
            PillButton(
                text = t("common.create", null),
                enabled = valid && online && !busy,
                modifier = Modifier.fillMaxWidth(),
                onClick = {
                    busy = true
                    error = null
                    scope.launch {
                        try {
                            usersVm.create(
                                CreateUserBody(
                                    email = email.trim(),
                                    password = password,
                                    profile = ProfileBody(
                                        firstName = firstName.trim(),
                                        phone = phone.trim().ifBlank { null },
                                    ),
                                    roleCodes = roles.value.toList(),
                                ),
                            )
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
