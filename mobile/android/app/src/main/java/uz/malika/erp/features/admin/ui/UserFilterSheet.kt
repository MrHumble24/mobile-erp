package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.features.admin.data.RoleDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.FilterSheet
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

private enum class ActiveFilter { ALL, ACTIVE, INACTIVE }

/**
 * User filter bottom sheet: the active-status facet and the role chips. Search
 * stays inline on the screen; every control applies immediately through the
 * ViewModel.
 */
@Composable
fun UserFilterSheet(
    active: Boolean?,
    role: String?,
    roles: List<RoleDto>,
    onActive: (Boolean?) -> Unit,
    onRole: (String?) -> Unit,
    canReset: Boolean,
    onReset: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val activeSel = when (active) {
        true -> ActiveFilter.ACTIVE
        false -> ActiveFilter.INACTIVE
        null -> ActiveFilter.ALL
    }
    FilterSheet(
        title = t("common.filter", null),
        onDismiss = onDismiss,
        canReset = canReset,
        onReset = onReset,
    ) {
        SegmentedControl(
            options = listOf(
                SegmentOption(ActiveFilter.ALL, t("common.all", null)),
                SegmentOption(ActiveFilter.ACTIVE, t("users.statusActive", null)),
                SegmentOption(ActiveFilter.INACTIVE, t("users.statusInactive", null)),
            ),
            selected = activeSel,
            onSelect = { sel ->
                onActive(
                    when (sel) {
                        ActiveFilter.ALL -> null
                        ActiveFilter.ACTIVE -> true
                        ActiveFilter.INACTIVE -> false
                    },
                )
            },
            modifier = Modifier.fillMaxWidth(),
        )
        if (roles.isNotEmpty()) {
            Row(
                Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(Tokens.Space.gap),
            ) {
                RoleFilterChip(t("common.all", null), role == null) { onRole(null) }
                roles.forEach { r -> RoleFilterChip(r.name, role == r.code) { onRole(r.code) } }
            }
        }
    }
}

@Composable
private fun RoleFilterChip(label: String, selected: Boolean, onClick: () -> Unit) {
    StatusChip(
        label = label,
        color = if (selected) Tokens.primary else Tokens.slate,
        modifier = Modifier.clickable(onClick = onClick),
    )
}
