package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.FileDownload
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import kotlinx.coroutines.delay
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.core.nowIso
import uz.malika.erp.features.sales.data.CustomerListItem
import uz.malika.erp.features.sales.data.CustomersRepository
import uz.malika.erp.features.sales.data.SalesApi
import uz.malika.erp.features.sales.lib.customersCsv
import uz.malika.erp.features.sales.model.CustomersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.shareTextFile
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.listBottomPadding
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.SearchFilterRow
import uz.malika.erp.ui.theme.Tokens

/** Searchable customer directory with aggregates, detail, and online-only create/edit. */
@Composable
fun CustomersScreen(container: AppContainer, api: SalesApi) {
    val t = LocalT.current
    val online by container.connectivity.online.collectAsState()
    val canManage = LocalCan.current("customer.manage")
    val vm: CustomersViewModel = viewModel(
        factory = viewModelFactory {
            initializer { CustomersViewModel(CustomersRepository(api)) }
        },
    )
    val ui by vm.list.collectAsState()
    val filters by vm.filters.collectAsState()
    val stats by vm.stats.collectAsState()
    val context = LocalContext.current
    val listItems = ui.state.items

    var search by remember { mutableStateOf("") }
    var hasPurchases by remember { mutableStateOf("all") }
    var sort by remember { mutableStateOf("recent") }
    var showFilters by remember { mutableStateOf(false) }
    var selected by remember { mutableStateOf<CustomerListItem?>(null) }
    var formFor by remember { mutableStateOf<FormTarget?>(null) }

    LaunchedEffect(search) {
        delay(300)
        vm.setSearch(search.trim())
    }
    val activeFilters = listOf(filters.hasPurchases != null, filters.sort != "recent").count { it }

    Scaffold(
        // AppShell already reserves system-bar insets; zero this nested Scaffold's
        // so the content is not padded twice.
        contentWindowInsets = WindowInsets(0),
        floatingActionButton = {
            if (canManage) ExtendedFloatingActionButton(
                onClick = { formFor = FormTarget(null, "", null, null) },
                icon = { Icon(Icons.Outlined.PersonAdd, contentDescription = null) },
                text = { Text(t("sales.newCustomer", null)) },
                containerColor = Tokens.primary,
                contentColor = Tokens.primaryForeground,
                elevation = FloatingActionButtonDefaults.elevation(0.dp, 0.dp, 0.dp, 0.dp),
                shape = RoundedCornerShape(14.dp),
            )
        },
    ) { pad ->
        // Whole screen scrolls: header (CSV + stats + search + filters) rides in
        // the list as item 0, so it never pushes the rows off-screen as it grows.
        LazyColumn(Modifier.fillMaxSize().padding(pad), contentPadding = listBottomPadding(fab = true)) {
            item {
                Column(Modifier.padding(Tokens.Space.section)) {
                    stats?.let { CustomerSummary(it); Spacer(Modifier.height(Tokens.Space.section)) }
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        SearchFilterRow(
                            query = search,
                            onQueryChange = { search = it },
                            placeholder = t("common.search", null),
                            activeCount = activeFilters,
                            onOpenFilters = { showFilters = true },
                            modifier = Modifier.weight(1f),
                        )
                        Spacer(Modifier.width(Tokens.Space.gap))
                        IconButton(
                            onClick = {
                                shareTextFile(context, "customers-${nowIso().take(10)}.csv", customersCsv(listItems))
                            },
                            enabled = listItems.isNotEmpty(),
                        ) {
                            Icon(Icons.Outlined.FileDownload, contentDescription = t("customers.exportCsv", null), tint = Tokens.foreground)
                        }
                    }
                }
            }
            when {
                ui.state.loading && listItems.isEmpty() ->
                    item { Box(Modifier.fillParentMaxWidth().padding(vertical = 64.dp), contentAlignment = Alignment.Center) { Loading() } }
                ui.error != null ->
                    item { ErrorView(ui.error!!, onRetry = vm::refresh, retryLabel = t("common.retry", null)) }
                listItems.isEmpty() ->
                    item { EmptyView(t("sales.noCustomersFound", null)) }
                else -> {
                    items(listItems) { c ->
                        Box(Modifier.padding(horizontal = 16.dp)) { CustomerRow(c, t) { selected = c } }
                    }
                    item {
                        Box(Modifier.padding(horizontal = 16.dp)) {
                            LoadMoreFooter(ui.state.hasMore, ui.state.loading, vm::loadMore)
                        }
                    }
                }
            }
        }
    }

    selected?.let { c ->
        AppBottomSheet(onDismiss = { selected = null }) {
            CustomerDetailSheet(
                customer = c,
                vm = vm,
                canManage = canManage,
                onEdit = { formFor = FormTarget(c.id, c.name, c.phone, c.notes); selected = null },
            )
        }
    }

    formFor?.let { target ->
        CustomerFormDialog(vm, target, online) { formFor = null }
    }

    if (showFilters) {
        CustomerFilterSheet(
            hasPurchases = hasPurchases,
            sort = sort,
            onHasPurchases = { hasPurchases = it; vm.setHasPurchases(if (it == "all") null else it == "yes") },
            onSort = { sort = it; vm.setSort(it) },
            canReset = activeFilters > 0 || search.isNotBlank(),
            onReset = { search = ""; hasPurchases = "all"; sort = "recent"; vm.clearFilters() },
            onDismiss = { showFilters = false },
        )
    }
}

@Composable
private fun CustomerRow(c: CustomerListItem, t: uz.malika.erp.i18n.Translate, onClick: () -> Unit) {
    AppCard(Modifier.fillMaxWidth().padding(vertical = 6.dp), onClick = onClick) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(c.name, style = MaterialTheme.typography.titleSmall)
                c.phone?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                Text(t("pos.purchaseCount", mapOf("count" to c.purchaseCount)), style = MaterialTheme.typography.bodySmall)
            }
            Text(formatMoney(c.totalSpent.toString()), style = MaterialTheme.typography.titleSmall)
        }
    }
}
