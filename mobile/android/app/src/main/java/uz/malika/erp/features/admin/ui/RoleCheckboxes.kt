package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import uz.malika.erp.features.admin.model.AccessViewModel
import uz.malika.erp.features.admin.model.Async
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * A labelled, scrollable column of role checkboxes. Shared by the create-user
 * form and the user roles editor. [selected] holds the chosen role codes.
 */
@Composable
fun RoleCheckboxes(
    accessVm: AccessViewModel,
    selected: Set<String>,
    onToggle: (String) -> Unit,
) {
    val t = LocalT.current
    val roles by accessVm.roles.collectAsStateWithLifecycle()

    Column(Modifier.fillMaxWidth()) {
        Text(t("users.roles", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.sm))
        when (val state = roles) {
            is Async.Ok -> Column {
                state.value.forEach { role ->
                    Row(Modifier.fillMaxWidth().heightIn(min = Tokens.minTouch), verticalAlignment = Alignment.CenterVertically) {
                        AdminCheckbox(
                            checked = selected.contains(role.code),
                            onCheckedChange = { onToggle(role.code) },
                        )
                        Column {
                            Text(role.name, style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
                            Text(role.code, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted)
                        }
                    }
                }
            }
            is Async.Fail -> Text(state.message, style = MaterialTheme.typography.bodySmall)
            Async.Loading -> Text("…", style = MaterialTheme.typography.bodySmall)
        }
    }
}
