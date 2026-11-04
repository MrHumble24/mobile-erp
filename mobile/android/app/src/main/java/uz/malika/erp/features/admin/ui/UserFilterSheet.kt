package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.features.admin.data.RoleDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.FilterSheet
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens
import uz.malika.erp.shared.ui.AppSelect

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
            AppSelect(
                value = roles.firstOrNull { it.code == role },
                options = roles,
                optionLabel = { it.name },
                onSelect = { onRole(it?.code) },
                label = t("users.filterRole", null),
                placeholder = t("common.all", null),
                nullOption = t("common.all", null),
            )
        }
    }
}
