package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
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
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.VerticalDivider
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
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
import uz.malika.erp.app.Destination
import uz.malika.erp.app.LocalCan
import uz.malika.erp.core.nowIso
import uz.malika.erp.data.remote.HttpClient
import uz.malika.erp.features.sales.data.Sale
import uz.malika.erp.features.sales.data.SaleChannel
import uz.malika.erp.features.sales.data.SalesApi
import uz.malika.erp.features.sales.data.SalesRepository
import uz.malika.erp.shared.lib.formatDate
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.features.sales.lib.salesCsv
import uz.malika.erp.features.sales.model.SalesViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.shareTextFile
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.listBottomPadding
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.SearchFilterRow
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

private const val WIDE = 840

/** Sales list with filters/stats/paging/CSV, a warranty-lookup panel, detail, receipt and returns. */
@Composable
fun SalesScreen(container: AppContainer, api: SalesApi) {
    val t = LocalT.current
    val online by container.connectivity.online.collectAsState()
    val canReadUsers = LocalCan.current("user.read")
    val vm: SalesViewModel = viewModel(
        factory = viewModelFactory {
            initializer { SalesViewModel(SalesRepository(api, container.db, HttpClient.json)) }
        },
    )
    val listUi by vm.list.collectAsState()
    val filters by vm.filters.collectAsState()
    val stats by vm.stats.collectAsState()
    val cashiers by vm.cashiers.collectAsState()
    val receiptUi by vm.receipt.collectAsState()
    val context = LocalContext.current

    var selected by remember { mutableStateOf<Sale?>(null) }
    var returnSaleId by remember { mutableStateOf<String?>(null) }
    // The sale being returned, when opened from its detail — carries the payment
    // accounts so the dialog can say where the refund goes (null from the warranty path).
    var returnSale by remember { mutableStateOf<Sale?>(null) }
    var warrantySheet by remember { mutableStateOf(false) }
    var showFilters by remember { mutableStateOf(false) }
    var search by remember { mutableStateOf("") }
    var range by remember { mutableStateOf(DateRange()) }
    var statsExpanded by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(canReadUsers) { if (canReadUsers) vm.loadCashiers() }
    LaunchedEffect(search) {
        delay(300)
        vm.setSearch(search.trim().takeIf { it.isNotBlank() })
    }

    val activeFilters = listOf(
        filters.channel != null,
        filters.returned != null,
        filters.warranty != null,
        filters.soldById != null,
        filters.from != null,
    ).count { it }

    val items = listUi.state.items
    val listColumn: @Composable (Modifier) -> Unit = { mod ->
        // Whole screen scrolls: the header (CSV + stats + filters) rides in the
        // list as item 0, so tall stat/filter blocks never push the rows off-screen.
        LazyColumn(mod.fillMaxSize(), contentPadding = listBottomPadding(fab = true)) {
            item {
                Column(Modifier.padding(horizontal = Tokens.Space.screenH, vertical = Tokens.Space.section)) {
                    stats?.let {
                        SalesSummary(it, expanded = statsExpanded, onToggle = { statsExpanded = !statsExpanded })
                        Spacer(Modifier.height(Tokens.Space.section))
                    }
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        SearchFilterRow(
                            query = search,
                            onQueryChange = { search = it },
                            placeholder = t("sales.filterSearch", null),
                            activeCount = activeFilters,
                            onOpenFilters = { showFilters = true },
                            modifier = Modifier.weight(1f),
                        )
                        Spacer(Modifier.width(Tokens.Space.gap))
                        IconButton(
                            onClick = {
                                shareTextFile(
                                    context,
                                    "sales-${nowIso().take(10)}.csv",
                                    salesCsv(items, includeProfit = items.any { it.netProfit != null }),
                                )
                            },
                            enabled = items.isNotEmpty(),
                        ) {
                            Icon(Icons.Outlined.FileDownload, contentDescription = t("sales.exportCsv", null), tint = Tokens.foreground)
                        }
                    }
                }
            }
            when {
                listUi.state.loading && items.isEmpty() ->
                    item { Box(Modifier.fillParentMaxWidth().padding(vertical = 64.dp), contentAlignment = Alignment.Center) { Loading() } }
                listUi.error != null ->
                    item { ErrorView(listUi.error!!, onRetry = vm::refresh, retryLabel = t("common.retry", null)) }
                items.isEmpty() ->
                    item { EmptyView(t("sales.noSalesFound", null)) }
                else -> {
                    items(items) { sale ->
                        Box(Modifier.padding(horizontal = Tokens.Space.screenH)) { SaleRow(sale, t) { selected = sale } }
                    }
                    item {
                        Box(Modifier.padding(horizontal = Tokens.Space.screenH)) {
                            LoadMoreFooter(listUi.state.hasMore, listUi.state.loading, vm::loadMore)
                        }
                    }
                }
            }
        }
    }

    BoxWithConstraints(Modifier.fillMaxSize()) {
        if (maxWidth.value >= WIDE) {
            Row(Modifier.fillMaxSize()) {
                listColumn(Modifier.weight(1f))
                VerticalDivider(color = Tokens.border)
                Box(Modifier.width(360.dp).padding(16.dp)) {
                    WarrantyPanel(vm, online) { returnSale = null; returnSaleId = it }
                }
            }
        } else {
            Scaffold(
                // AppShell already reserves system-bar insets; zero this nested
                // Scaffold's so the content is not padded twice.
                contentWindowInsets = WindowInsets(0),
                floatingActionButton = {
                    ExtendedFloatingActionButton(
                        onClick = { warrantySheet = true },
                        icon = { Icon(Icons.Outlined.VerifiedUser, contentDescription = null) },
                        text = { Text(t("sales.warrantyLookup", null)) },
                        containerColor = Tokens.primary,
                        contentColor = Tokens.primaryForeground,
                        elevation = FloatingActionButtonDefaults.elevation(0.dp, 0.dp, 0.dp, 0.dp),
                        shape = RoundedCornerShape(14.dp),
                    )
                },
            ) { pad -> listColumn(Modifier.padding(pad)) }
        }
    }

    selected?.let { sale ->
        AppBottomSheet(onDismiss = { selected = null }) {
            SaleDetailSheet(
                sale = sale,
                canReturn = LocalCan.current("sale.return"),
                onReceipt = { vm.loadReceipt(sale.id) },
                onReturn = { selected = null; returnSale = sale; returnSaleId = sale.id },
                onOpenDevice = { selected = null; container.featureNav.open(Destination.Inventory(sale.code)) },
                onOpenConsignment = {
                    sale.consignmentId?.let { selected = null; container.featureNav.open(Destination.Consignments(it)) }
                },
            )
        }
    }

    receiptUi.data?.let { data ->
        AppBottomSheet(onDismiss = { vm.clearReceipt() }) {
            ReceiptSheet(data) { vm.clearReceipt() }
        }
    }

    if (warrantySheet) {
        AppBottomSheet(onDismiss = { warrantySheet = false }) {
            Box(Modifier.fillMaxWidth().height(520.dp).padding(16.dp)) {
                WarrantyPanel(vm, online) { returnSale = null; returnSaleId = it }
            }
        }
    }

    returnSaleId?.let { id ->
        val sale = returnSale?.takeIf { it.id == id }
        ReturnDialog(
            vm,
            id,
            online,
            container.toaster,
            refundAccounts = sale?.payments?.map { it.accountCode } ?: emptyList(),
            maxRefund = sale?.let { s ->
                s.payments.fold(java.math.BigDecimal.ZERO) { acc, p -> acc + p.amount }
                    .takeIf { it.signum() > 0 } ?: parseMoney(s.salePrice)
            } ?: java.math.BigDecimal.ZERO,
        ) { returnSaleId = null; returnSale = null }
    }

    if (showFilters) {
        SalesFilterSheet(
            vm = vm,
            values = SalesFilterValues(filters.channel, filters.returned, filters.warranty, filters.soldById),
            canReadUsers = canReadUsers,
            cashiers = cashiers,
            range = range,
            onRangeChange = { range = it },
            canReset = activeFilters > 0 || search.isNotBlank(),
            onReset = { search = ""; range = DateRange(); vm.clearFilters() },
            onDismiss = { showFilters = false },
        )
    }
}

/** One sale card: model, mono IMEI(s), customer · day left; mono price and the
 *  channel / returned pills right — the same anatomy as the iOS `SaleRow`. */
@Composable
private fun SaleRow(sale: Sale, t: uz.malika.erp.i18n.Translate, onClick: () -> Unit) {
    val retail = sale.channel == SaleChannel.RETAIL
    AppCard(Modifier.fillMaxWidth().padding(vertical = Tokens.Space.gap), onClick = onClick) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(sale.modelLabel, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                if (sale.isQuantity) {
                    // Quantity sale (ADR 0030): piece count, no unit code.
                    Text("× ${sale.quantity}", style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.text)
                } else {
                    Text(sale.code, style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.text)
                    sale.imei2?.takeIf { it.isNotBlank() }?.let {
                        Text(it, style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.muted)
                    }
                }
                Text(
                    "${sale.customerName ?: t("pos.walkIn", null)} · ${formatDate(sale.soldAt)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Tokens.muted,
                )
            }
            Spacer(Modifier.width(Tokens.Space.gap))
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(Tokens.Space.xs)) {
                MoneyText(sale.salePrice, style = MaterialTheme.typography.titleSmall.copy(color = Tokens.text))
                StatusChip(
                    if (retail) t("sales.channelRetail", null) else t("sales.channelB2B", null),
                    color = if (retail) Tokens.info else Tokens.warning,
                )
                if (sale.returnedAt != null) StatusChip(t("sales.returned", null), color = Tokens.danger)
            }
        }
    }
}
