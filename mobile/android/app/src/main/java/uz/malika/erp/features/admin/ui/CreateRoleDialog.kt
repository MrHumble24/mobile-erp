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
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.admin.model.AccessViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** Create a role. Code is forced UPPER_SNAKE (matches the web/Flutter rule). Online-only. */
@Composable
fun CreateRoleDialog(accessVm: AccessViewModel, online: Boolean, onDismiss: () -> Unit) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    var code by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val valid = code.isNotBlank() && name.isNotBlank()

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
            Text(t("users.newRole", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            Spacer(Modifier.height(Tokens.Space.lg))
            AppFormField(t("users.roleCode", null), code, { code = it.uppercase() }, placeholder = "CASHIER")
            Spacer(Modifier.height(Tokens.Space.md))
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
                text = t("common.create", null),
                enabled = valid && online && !busy,
                modifier = Modifier.fillMaxWidth(),
                onClick = {
                    busy = true; error = null
                    scope.launch {
                        try {
                            accessVm.create(code.trim().uppercase(), name.trim(), description.trim())
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
