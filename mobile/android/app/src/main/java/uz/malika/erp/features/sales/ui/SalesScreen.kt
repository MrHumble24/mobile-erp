package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.VerticalDivider
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
import uz.malika.erp.AppContainer
import uz.malika.erp.app.Destination
import uz.malika.erp.app.LocalCan
import uz.malika.erp.core.nowIso
import uz.malika.erp.data.remote.HttpClient
import uz.malika.erp.features.sales.data.Sale
import uz.malika.erp.features.sales.data.SaleChannel
import uz.malika.erp.features.sales.data.SalesApi
import uz.malika.erp.features.sales.data.SalesRepository
import uz.malika.erp.features.sales.lib.formatDate
import uz.malika.erp.features.sales.lib.salesCsv
import uz.malika.erp.features.sales.model.SalesViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.shareTextFile
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
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
    var warrantySheet by remember { mutableStateOf(false) }

    LaunchedEffect(canReadUsers) { if (canReadUsers) vm.loadCashiers() }

    val items = listUi.state.items
    val listColumn: @Composable (Modifier) -> Unit = { mod ->
        Column(mod) {
            Column(Modifier.padding(16.dp)) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text(t("sales.title", null), style = MaterialTheme.typography.headlineSmall, modifier = Modifier.weight(1f))
                    PillButton(
                        text = t("sales.exportCsv", null),
                        onClick = {
                            shareTextFile(
                                context,
                                "sales-${nowIso().take(10)}.csv",
                                salesCsv(items, includeProfit = items.any { it.netProfit != null }),
                            )
                        },
                        variant = ButtonVariant.OUTLINE,
                        enabled = items.isNotEmpty(),
                    )
                }
                Spacer(Modifier.height(12.dp))
                stats?.let { SalesSummary(it); Spacer(Modifier.height(12.dp)) }
                SalesFiltersBar(
                    vm = vm,
                    values = SalesFilterValues(filters.channel, filters.returned, filters.warranty, filters.soldById),
                    canReadUsers = canReadUsers,
                    cashiers = cashiers,
                )
            }
            when {
                listUi.state.loading && items.isEmpty() -> Box(Modifier.fillMaxSize()) { Loading() }
                listUi.error != null -> ErrorView(listUi.error!!, onRetry = vm::refresh, retryLabel = t("common.retry", null))
                items.isEmpty() -> EmptyView(t("sales.noSalesFound", null))
                else -> LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
                    items(items) { sale -> SaleRow(sale, t) { selected = sale } }
                    item {
                        LoadMoreFooter(listUi.state.hasMore, listUi.state.loading, vm::loadMore)
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
                    WarrantyPanel(vm, online) { returnSaleId = it }
                }
            }
        } else {
            Scaffold(
                floatingActionButton = {
                    ExtendedFloatingActionButton(
                        onClick = { warrantySheet = true },
                        icon = { Icon(Icons.Outlined.VerifiedUser, contentDescription = null) },
                        text = { Text(t("sales.warrantyLookup", null)) },
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
                onReturn = { selected = null; returnSaleId = sale.id },
                onOpenDevice = { selected = null; container.featureNav.open(Destination.Inventory(sale.imei)) },
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
                WarrantyPanel(vm, online) { returnSaleId = it }
            }
        }
    }

    returnSaleId?.let { id ->
        ReturnDialog(vm, id, online, container.toaster) { returnSaleId = null }
    }
}

@Composable
private fun SaleRow(sale: Sale, t: uz.malika.erp.i18n.Translate, onClick: () -> Unit) {
    val retail = sale.channel == SaleChannel.RETAIL
    AppCard(Modifier.fillMaxWidth().padding(vertical = 6.dp), onClick = onClick) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(sale.modelLabel, style = MaterialTheme.typography.titleSmall)
                Text(sale.imei, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily))
                Text(
                    "${sale.customerName ?: t("pos.walkIn", null)} · ${formatDate(sale.soldAt)}",
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                MoneyText(sale.salePrice, style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(4.dp))
                StatusChip(
                    if (retail) t("sales.channelRetail", null) else t("sales.channelB2B", null),
                    color = if (retail) Tokens.signalBlue else Tokens.warning,
                )
                if (sale.returnedAt != null) {
                    Spacer(Modifier.height(4.dp))
                    StatusChip(t("sales.returned", null), color = Tokens.danger)
                }
            }
        }
    }
}
