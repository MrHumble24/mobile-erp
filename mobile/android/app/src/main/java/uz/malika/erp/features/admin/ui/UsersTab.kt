package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.PersonAddAlt1
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import uz.malika.erp.features.admin.model.Async
import uz.malika.erp.features.admin.model.UsersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.listBottomPadding
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.SearchFilterRow
import uz.malika.erp.shared.ui.StatusChip
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** Users list: summary, inline search + filter sheet, create, and a tappable card per user → detail sheet. */
@Composable
fun UsersTab(container: AppContainer, usersVm: UsersViewModel, accessVm: AccessViewModel) {
    val t = LocalT.current
    val online by container.connectivity.online.collectAsStateWithLifecycle()
    val users by usersVm.users.collectAsStateWithLifecycle()
    val filters by usersVm.filters.collectAsStateWithLifecycle()
    val roles by accessVm.roles.collectAsStateWithLifecycle()
    val roleList = (roles as? Async.Ok)?.value.orEmpty()
    var createOpen by remember { mutableStateOf(false) }
    var showFilters by remember { mutableStateOf(false) }
    var detail by remember { mutableStateOf<UserDto?>(null) }

    val activeFilters = listOf(filters.role != null, filters.active != null).count { it }

    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = listBottomPadding().calculateBottomPadding()),
        verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg),
    ) {
        item {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = Tokens.Space.screenH),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                SearchFilterRow(
                    query = filters.search,
                    onQueryChange = usersVm::setSearch,
                    placeholder = t("users.filterSearch", null),
                    activeCount = activeFilters,
                    onOpenFilters = { showFilters = true },
                    modifier = Modifier.weight(1f),
                )
                IconButton(onClick = { createOpen = true }, enabled = online) {
                    Icon(Icons.Outlined.PersonAddAlt1, contentDescription = t("users.newUser", null), tint = Tokens.text)
                }
            }
        }
        item { UsersSummary(usersVm) }
        item {
            AsyncContent(users, onRetry = usersVm::load) { page ->
                UsersList(page.items, onOpen = { detail = it })
                LoadMoreFooter(page.hasMore, page.loading, onLoadMore = usersVm::loadMore)
            }
        }
    }

    if (showFilters) {
        UserFilterSheet(
            active = filters.active,
            role = filters.role,
            roles = roleList,
            onActive = usersVm::setActive,
            onRole = usersVm::setRole,
            canReset = activeFilters > 0 || filters.search.isNotBlank(),
            onReset = usersVm::reset,
            onDismiss = { showFilters = false },
        )
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
        Box(Modifier.padding(horizontal = Tokens.Space.screenH)) { AppCard(Modifier.fillMaxWidth()) { EmptyView(t("common.notFound", null), compact = true) } }
        return
    }
    Column(Modifier.padding(horizontal = Tokens.Space.screenH), verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg)) {
        list.forEach { user -> UserCard(user, onClick = { onOpen(user) }) }
    }
}

@Composable
private fun UserCard(user: UserDto, onClick: () -> Unit) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth(), onClick = onClick) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(user.displayName, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                Text(user.email, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted)
                if (user.roles.isNotEmpty()) {
                    Spacer(Modifier.height(Tokens.Space.xs))
                    Row(horizontalArrangement = Arrangement.spacedBy(Tokens.Space.xs)) {
                        user.roles.take(3).forEach { StatusChip(it, color = Tokens.sold) }
                    }
                }
            }
            Spacer(Modifier.width(Tokens.Space.gap))
            StatusChip(
                label = if (user.isActive) t("users.statusActive", null) else t("users.statusInactive", null),
                color = if (user.isActive) Tokens.success else Tokens.danger,
            )
        }
    }
}
