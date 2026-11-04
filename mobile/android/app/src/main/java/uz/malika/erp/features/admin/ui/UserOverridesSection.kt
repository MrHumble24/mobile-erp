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
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.admin.data.OverrideBody
import uz.malika.erp.features.admin.data.UserDto
import uz.malika.erp.features.admin.model.AccessViewModel
import uz.malika.erp.features.admin.model.Async
import uz.malika.erp.features.admin.model.UsersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.RoundedCornerShape
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.MonoFamily

private enum class Choice { INHERIT, GRANT, REVOKE }

/** Human source for a permission given its override + role grants (mirrors web sourceLabel). */
@Composable
private fun sourceLabel(
    choice: Choice,
    roleCodes: List<String>,
    t: (String, Map<String, Any?>?) -> String,
): Pair<String, androidx.compose.ui.graphics.Color> = when {
    choice == Choice.GRANT -> t("users.sourceUserGrant", null) to Tokens.success
    choice == Choice.REVOKE -> t("users.sourceUserRevoke", null) to Tokens.danger
    roleCodes.isNotEmpty() -> t("users.sourceRoles", mapOf("roles" to roleCodes.joinToString(", "))) to Tokens.info
    else -> t("users.sourceNone", null) to Tokens.muted
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
            Text(t("users.selfPermsLocked", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            Spacer(Modifier.height(Tokens.Space.sm))
        }
        val perms = (permissions as? Async.Ok)?.value.orEmpty()
        // One surface-2 block per permission: mono code, its source, the three-way control.
        Column(verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
            perms.forEach { p ->
                val choice = choices[p.code] ?: Choice.INHERIT
                val source = sourceLabel(choice, roleGrants[p.code].orEmpty(), t)
                Column(
                    Modifier.fillMaxWidth()
                        .background(Tokens.surface2, RoundedCornerShape(Tokens.Radius.controls))
                        .padding(Tokens.Space.md),
                    verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm),
                ) {
                    Text(p.code, style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.text)
                    Text(source.first, style = MaterialTheme.typography.bodySmall, color = source.second)
                    SegmentedControl(
                        options = listOf(
                            SegmentOption(Choice.INHERIT, t("users.overrideInherit", null)),
                            SegmentOption(Choice.GRANT, t("users.overrideGrant", null)),
                            SegmentOption(Choice.REVOKE, t("users.overrideRevoke", null)),
                        ),
                        selected = choice,
                        onSelect = { if (!isSelf) choices[p.code] = it },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }
        if (error != null) {
            Spacer(Modifier.height(Tokens.Space.sm))
            Text(error!!, style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
        }
        Spacer(Modifier.height(Tokens.Space.lg))
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


