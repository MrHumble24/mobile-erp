package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
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
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl

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
    var selected by remember { mutableStateOf<CustomerListItem?>(null) }
    var formFor by remember { mutableStateOf<FormTarget?>(null) }

    Scaffold(
        // AppShell already reserves system-bar insets; zero this nested Scaffold's
        // so the content is not padded twice.
        contentWindowInsets = WindowInsets(0),
        floatingActionButton = {
            if (canManage) ExtendedFloatingActionButton(
                onClick = { formFor = FormTarget(null, "", null, null) },
                icon = { Icon(Icons.Outlined.PersonAdd, contentDescription = null) },
                text = { Text(t("sales.newCustomer", null)) },
            )
        },
    ) { pad ->
        // Whole screen scrolls: header (CSV + stats + search + filters) rides in
        // the list as item 0, so it never pushes the rows off-screen as it grows.
        LazyColumn(Modifier.fillMaxSize().padding(pad)) {
            item {
                Column(Modifier.padding(16.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End, verticalAlignment = Alignment.CenterVertically) {
                        PillButton(
                            text = t("customers.exportCsv", null),
                            onClick = {
                                shareTextFile(context, "customers-${nowIso().take(10)}.csv", customersCsv(listItems))
                            },
                            variant = ButtonVariant.OUTLINE,
                            enabled = listItems.isNotEmpty(),
                        )
                    }
                    Spacer(Modifier.height(12.dp))
                    stats?.let { CustomerSummary(it); Spacer(Modifier.height(12.dp)) }
                    AppTextField(
                        value = search,
                        onValueChange = { search = it },
                        placeholder = t("common.search", null),
                        imeAction = ImeAction.Search,
                        keyboardActions = KeyboardActions(onSearch = { vm.setSearch(search.trim()) }),
                    )
                    Spacer(Modifier.height(8.dp))
                    SegmentedControl(
                        options = listOf(
                            SegmentOption("all", t("common.all", null)),
                            SegmentOption("yes", t("common.yes", null)),
                            SegmentOption("no", t("common.no", null)),
                        ),
                        selected = hasPurchases,
                        onSelect = {
                            hasPurchases = it
                            vm.setHasPurchases(if (it == "all") null else it == "yes")
                        },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(8.dp))
                    SegmentedControl(
                        options = listOf(
                            SegmentOption("recent", t("common.date", null)),
                            SegmentOption("name", t("common.name", null)),
                        ),
                        selected = sort,
                        onSelect = { sort = it; vm.setSort(it) },
                        modifier = Modifier.fillMaxWidth(),
                    )
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
