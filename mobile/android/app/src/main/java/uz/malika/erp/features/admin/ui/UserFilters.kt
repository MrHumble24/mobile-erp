package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import uz.malika.erp.features.admin.model.AccessViewModel
import uz.malika.erp.features.admin.model.Async
import uz.malika.erp.features.admin.model.UsersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

private enum class ActiveFilter { ALL, ACTIVE, INACTIVE }

/** Search + role + status filters over the users list. Mirrors the web UserFilters. */
@Composable
fun UserFilters(usersVm: UsersViewModel, accessVm: AccessViewModel) {
    val t = LocalT.current
    val filters by usersVm.filters.collectAsStateWithLifecycle()
    val roles by accessVm.roles.collectAsStateWithLifecycle()
    val roleList = (roles as? Async.Ok)?.value.orEmpty()

    val active = when (filters.active) {
        true -> ActiveFilter.ACTIVE
        false -> ActiveFilter.INACTIVE
        null -> ActiveFilter.ALL
    }

    Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
        AppTextField(
            value = filters.search,
            onValueChange = usersVm::setSearch,
            placeholder = t("users.filterSearch", null),
            leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null) },
        )
        Spacer(Modifier.height(10.dp))

        SegmentedControl(
            options = listOf(
                SegmentOption(ActiveFilter.ALL, t("common.all", null)),
                SegmentOption(ActiveFilter.ACTIVE, t("users.statusActive", null)),
                SegmentOption(ActiveFilter.INACTIVE, t("users.statusInactive", null)),
            ),
            selected = active,
            onSelect = { sel ->
                usersVm.setActive(
                    when (sel) {
                        ActiveFilter.ALL -> null
                        ActiveFilter.ACTIVE -> true
                        ActiveFilter.INACTIVE -> false
                    },
                )
            },
        )

        if (roleList.isNotEmpty()) {
            Spacer(Modifier.height(10.dp))
            Row(
                Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                RoleFilterChip(t("common.all", null), filters.role == null) { usersVm.setRole(null) }
                roleList.forEach { role ->
                    RoleFilterChip(role.name, filters.role == role.code) { usersVm.setRole(role.code) }
                }
            }
        }

        Spacer(Modifier.height(10.dp))
        PillButton(
            text = t("users.resetFilters", null),
            onClick = usersVm::reset,
            variant = ButtonVariant.GHOST,
        )
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
