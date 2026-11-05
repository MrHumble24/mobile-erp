package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.FileDownload
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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
import uz.malika.erp.features.sales.lib.PriceLevel
import uz.malika.erp.features.sales.lib.customersCsv
import uz.malika.erp.features.sales.model.CustomersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.shareTextFile
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.SearchFilterRow
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.shared.ui.listBottomPadding
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Customer directory on the Warm Card ground: inline search beside the filter
 * button, new-customer and CSV as icon actions, the summary list-card, then
 * one card per customer (name, mono phone, purchase count; total spent and a
 * warranty pill right). Rows open the detail sheet; create/edit are
 * online-only (`customer.manage`).
 */
@Composable
fun CustomersScreen(container: AppContainer, api: SalesApi) {
    val t = LocalT.current
    val online by container.connectivity.online.collectAsState()
    val canManage = LocalCan.current("customer.manage")
    val vm: CustomersViewModel = viewModel(
        factory = viewModelFactory { initializer { CustomersViewModel(CustomersRepository(api)) } },
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

    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = Tokens.Space.screenH, end = Tokens.Space.screenH, top = Tokens.Space.md, bottom = listBottomPadding().calculateBottomPadding()),
        verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg),
    ) {
        item {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                SearchFilterRow(
                    query = search,
                    onQueryChange = { search = it },
                    placeholder = t("customers.searchPlaceholder", null),
                    activeCount = activeFilters,
                    onOpenFilters = { showFilters = true },
                    modifier = Modifier.weight(1f),
                )
                if (canManage) {
                    IconButton(onClick = { formFor = FormTarget(null, "", null, null) }) {
                        Icon(Icons.Outlined.PersonAdd, contentDescription = t("customers.newCustomer", null), tint = Tokens.text)
                    }
                }
                IconButton(
                    onClick = { shareTextFile(context, "customers-${nowIso().take(10)}.csv", customersCsv(listItems)) },
                    enabled = listItems.isNotEmpty(),
                ) {
                    Icon(Icons.Outlined.FileDownload, contentDescription = t("customers.exportCsv", null), tint = Tokens.text)
                }
            }
        }
        stats?.let { s -> item { CustomerSummary(s) } }
        when {
            ui.state.loading && listItems.isEmpty() ->
                item { Box(Modifier.fillMaxWidth().height(160.dp), contentAlignment = Alignment.Center) { Loading() } }
            ui.error != null ->
                item { ErrorView(ui.error!!, onRetry = vm::refresh, retryLabel = t("common.retry", null)) }
            listItems.isEmpty() ->
                item { AppCard(Modifier.fillMaxWidth()) { EmptyView(t("customers.empty", null), compact = true) } }
            else -> {
                items(listItems, key = { it.id }) { c -> CustomerCard(c) { selected = c } }
                item { LoadMoreFooter(ui.state.hasMore, ui.state.loading, vm::loadMore) }
            }
        }
    }

    selected?.let { c ->
        AppBottomSheet(onDismiss = { selected = null }) {
            CustomerDetailSheet(
                container = container,
                customer = c,
                vm = vm,
                canManage = canManage,
                onEdit = {
                    formFor = FormTarget(c.id, c.name, c.phone, c.notes, c.priceLevelCode, c.standingDiscountPercent, c.creditLimit ?: "")
                    selected = null
                },
            )
        }
    }
    formFor?.let { target -> CustomerFormSheet(vm, target, online) { formFor = null } }
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
private fun CustomerCard(c: CustomerListItem, onClick: () -> Unit) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth(), onClick = onClick) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(c.name, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                c.phone?.let { Text(it, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted) }
                Text(t("pos.purchaseCount", mapOf("count" to c.purchaseCount)), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                val standing = c.standingDiscountPercent.toDoubleOrNull() ?: 0.0
                val levelLabel = t(PriceLevel.labelKey(c.priceLevelCode), null)
                val sub = if (standing > 0) "$levelLabel · ${t("pricing.standingDiscount", null)} ${c.standingDiscountPercent}%" else levelLabel
                Text(sub, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            }
            Spacer(Modifier.width(Tokens.Space.gap))
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(Tokens.Space.xs)) {
                Text(
                    formatMoney(c.totalSpent.toString()),
                    style = MaterialTheme.typography.titleSmall.copy(fontFamily = MonoFamily),
                    color = Tokens.text,
                )
                if (c.activeWarranties > 0) {
                    StatusChip(t("pos.warrantyCount", mapOf("count" to c.activeWarranties)), color = Tokens.success)
                }
            }
        }
    }
}
