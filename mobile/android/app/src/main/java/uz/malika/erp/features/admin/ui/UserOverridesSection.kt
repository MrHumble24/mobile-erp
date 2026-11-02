package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.admin.data.OverrideBody
import uz.malika.erp.features.admin.data.UserDto
import uz.malika.erp.features.admin.model.AccessViewModel
import uz.malika.erp.features.admin.model.Async
import uz.malika.erp.features.admin.model.UsersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

private enum class Choice { INHERIT, GRANT, REVOKE }

/** Human source for a permission given its override + role grants (mirrors web sourceLabel). */
private fun sourceLabel(
    choice: Choice,
    roleCodes: List<String>,
    t: (String, Map<String, Any?>?) -> String,
): Pair<String, androidx.compose.ui.graphics.Color> = when {
    choice == Choice.GRANT -> t("users.sourceUserGrant", null) to Tokens.success
    choice == Choice.REVOKE -> t("users.sourceUserRevoke", null) to Tokens.slate
    roleCodes.isNotEmpty() -> t("users.sourceRoles", mapOf("roles" to roleCodes.joinToString(", "))) to Tokens.primary
    else -> t("users.sourceNone", null) to Tokens.slate
}

/**
 * Per-user permission overrides. Each permission starts at its current override
 * (inherit / grant / revoke), loaded from `/users/:id/effective-permissions`.
 * Save REPLACES the whole override set (only grant/revoke are sent). Self-lock.
 */
@Composable
fun UserOverridesSection(
    usersVm: UsersViewModel,
    accessVm: AccessViewModel,
    user: UserDto,
    isSelf: Boolean,
    online: Boolean,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val permissions by accessVm.permissions.collectAsState()
    val choices = remember(user.id) { mutableStateMapOf<String, Choice>() }
    val roleGrants = remember(user.id) { mutableStateMapOf<String, List<String>>() }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(user.id) {
        runCatching { usersVm.effectivePermissions(user.id) }.getOrNull()?.let { perms ->
            perms.overrides.forEach { o ->
                choices[o.permissionCode] = if (o.granted) Choice.GRANT else Choice.REVOKE
            }
            perms.roleGrants.forEach { g -> roleGrants[g.permissionCode] = g.roleCodes }
        }
    }

    Column(Modifier.fillMaxWidth()) {
        if (isSelf) {
            Text(t("users.selfPermsLocked", null), style = MaterialTheme.typography.bodySmall, color = Tokens.slate)
            Spacer(Modifier.height(8.dp))
        }
        val perms = (permissions as? Async.Ok)?.value.orEmpty()
        Column(Modifier.heightIn(max = 340.dp).verticalScroll(rememberScrollState())) {
            perms.forEach { p ->
                val choice = choices[p.code] ?: Choice.INHERIT
                val source = sourceLabel(choice, roleGrants[p.code].orEmpty(), t)
                Row(
                    Modifier.fillMaxWidth().padding(vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(p.code, style = MaterialTheme.typography.bodySmall)
                        StatusChip(source.first, color = source.second)
                    }
                    ChoiceChip(t("users.overrideInherit", null), choice == Choice.INHERIT, Tokens.slate, isSelf) { choices[p.code] = Choice.INHERIT }
                    ChoiceChip(t("users.overrideGrant", null), choice == Choice.GRANT, Tokens.success, isSelf) { choices[p.code] = Choice.GRANT }
                    ChoiceChip(t("users.overrideRevoke", null), choice == Choice.REVOKE, Tokens.danger, isSelf) { choices[p.code] = Choice.REVOKE }
                }
            }
        }
        if (error != null) {
            Spacer(Modifier.height(8.dp))
            Text(error!!, style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
        }
        Spacer(Modifier.height(12.dp))
        PillButton(
            text = t("users.saveMatrix", null),
            enabled = online && !busy && !isSelf,
            modifier = Modifier.fillMaxWidth(),
            onClick = {
                busy = true; error = null
                val overrides = choices.entries
                    .filter { it.value != Choice.INHERIT }
                    .map { OverrideBody(it.key, it.value == Choice.GRANT) }
                scope.launch {
                    try {
                        usersVm.setPermissions(user.id, overrides)
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

@Composable
private fun ChoiceChip(label: String, selected: Boolean, color: androidx.compose.ui.graphics.Color, locked: Boolean, onClick: () -> Unit) {
    StatusChip(
        label = label,
        color = if (selected) color else Tokens.border,
        modifier = if (locked) Modifier else Modifier.clickable(onClick = onClick),
    )
}
