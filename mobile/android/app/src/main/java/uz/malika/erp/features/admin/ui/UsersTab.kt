package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.PersonAddAlt1
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import uz.malika.erp.AppContainer
import uz.malika.erp.features.admin.data.UserDto
import uz.malika.erp.features.admin.model.AccessViewModel
import uz.malika.erp.features.admin.model.UsersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/** Users list: summary, filters, create, and a tappable card per user → detail sheet. */
@Composable
fun UsersTab(container: AppContainer, usersVm: UsersViewModel, accessVm: AccessViewModel) {
    val t = LocalT.current
    val online by container.connectivity.online.collectAsStateWithLifecycle()
    val users by usersVm.users.collectAsStateWithLifecycle()
    var createOpen by remember { mutableStateOf(false) }
    var detail by remember { mutableStateOf<UserDto?>(null) }

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 24.dp)) {
        item { UsersSummary(usersVm) }
        item { Spacer(Modifier.height(12.dp)) }
        item { UserFilters(usersVm, accessVm) }
        item {
            Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.End) {
                PillButton(
                    text = t("users.newUser", null),
                    onClick = { createOpen = true },
                    enabled = online,
                )
            }
        }
        item { AsyncContent(users, onRetry = usersVm::load) { list -> UsersList(list, onOpen = { detail = it }) } }
    }

    if (createOpen) {
        CreateUserDialog(accessVm, usersVm, online, onDismiss = { createOpen = false })
    }
    detail?.let { user ->
        UserDetailSheet(container, usersVm, accessVm, user, online, onDismiss = { detail = null })
    }
}

@Composable
private fun UsersList(list: List<UserDto>, onOpen: (UserDto) -> Unit) {
    val t = LocalT.current
    if (list.isEmpty()) {
        EmptyView(t("common.notFound", null))
        return
    }
    Column(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        list.forEach { user -> UserCard(user, onClick = { onOpen(user) }) }
    }
}

@Composable
private fun UserCard(user: UserDto, onClick: () -> Unit) {
    val t = LocalT.current
    AppCard(onClick = onClick) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(user.displayName, style = MaterialTheme.typography.titleMedium)
                Text(user.email, style = MaterialTheme.typography.bodySmall)
                if (user.roles.isNotEmpty()) {
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        user.roles.take(3).forEach { StatusChip(it, color = Tokens.slate) }
                    }
                }
            }
            Spacer(Modifier.width(12.dp))
            StatusChip(
                label = if (user.isActive) t("users.statusActive", null) else t("users.statusInactive", null),
                color = if (user.isActive) Tokens.success else Tokens.danger,
            )
        }
    }
}
