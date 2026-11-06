package uz.malika.erp.features.orders.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.PullToRefreshDefaults
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.features.orders.data.OrdersApi
import uz.malika.erp.features.orders.data.OrdersRepository
import uz.malika.erp.features.orders.data.StorefrontOrderListItem
import uz.malika.erp.features.orders.lib.OrderTimeFormat
import uz.malika.erp.features.orders.lib.orderSpecLine
import uz.malika.erp.features.orders.model.OrdersBadge
import uz.malika.erp.features.orders.model.OrdersListViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.OfflineBanner
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.shared.ui.TabChipItem
import uz.malika.erp.shared.ui.TabChips
import uz.malika.erp.shared.ui.listBottomPadding
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** Online storefront orders (More tab, ADR 0049/0050): status chips, newest-first
 *  list with paging and pull-to-refresh, tap a row for the detail + status actions. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(container: AppContainer) {
    val t = LocalT.current
    val online by container.connectivity.online.collectAsState()
    val repo = remember { OrdersRepository(container.retrofit.create(OrdersApi::class.java)) }
    val vm: OrdersListViewModel = viewModel(factory = viewModelFactory { initializer { OrdersListViewModel(repo) } })
    val status by vm.status.collectAsState()
    val ui by vm.ui.collectAsState()
    var detailId by remember { mutableStateOf<String?>(null) }

    val items = ui.state.items
    val pullState = rememberPullToRefreshState()

    Column(Modifier.fillMaxSize()) {
        Spacer(Modifier.height(Tokens.Space.md))
        TabChips(
            items = ORDER_STATUS_FILTERS.map { TabChipItem(it, t(orderStatusLabelKey(it), null)) },
            selected = status,
            onSelect = { vm.setStatus(it) },
        )
        Spacer(Modifier.height(Tokens.Space.sm))
        PullToRefreshBox(
            isRefreshing = ui.refreshing,
            onRefresh = vm::refresh,
            state = pullState,
            modifier = Modifier.fillMaxSize().background(Tokens.ground),
            indicator = {
                PullToRefreshDefaults.Indicator(
                    state = pullState,
                    isRefreshing = ui.refreshing,
                    modifier = Modifier.align(Alignment.TopCenter),
                    containerColor = Tokens.card,
                    color = Tokens.text,
                )
            },
        ) {
            LazyColumn(
                Modifier.fillMaxSize(),
                contentPadding = PaddingValues(
                    start = Tokens.Space.screenH,
                    end = Tokens.Space.screenH,
                    top = Tokens.Space.sm,
                    bottom = listBottomPadding().calculateBottomPadding(),
                ),
                verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm),
            ) {
                when {
                    !online && items.isEmpty() -> item { OfflineBanner(t("orders.offlineNotice", null)) }
                    ui.state.loading && items.isEmpty() ->
                        item { Box(Modifier.fillMaxWidth().height(160.dp), contentAlignment = Alignment.Center) { Loading() } }
                    ui.error != null && items.isEmpty() ->
                        item { ErrorView(ui.error!!, retryLabel = t("common.retry", null), onRetry = vm::refresh) }
                    items.isEmpty() ->
                        item { AppCard(Modifier.fillMaxWidth()) { EmptyView(t("orders.noOrders", null), compact = true) } }
                    else -> {
                        items(items, key = { it.id }) { row -> OrderRow(row) { detailId = row.id } }
                        item { LoadMoreFooter(ui.state.hasMore, ui.state.loading, vm::loadMore) }
                    }
                }
            }
        }
    }

    detailId?.let { id ->
        AppBottomSheet(onDismiss = { detailId = null; vm.refresh(); OrdersBadge.refresh(container.appScope, repo) }) {
            OrderDetailSheet(container, repo, id, onClosed = { detailId = null })
        }
    }
}

@Composable
private fun OrderRow(order: StorefrontOrderListItem, onOpen: () -> Unit) {
    val t = LocalT.current
    val specs = orderSpecLine(order.specs)
    val ago = OrderTimeFormat.format(order.createdAt, System.currentTimeMillis(), t)
    AppCard(Modifier.fillMaxWidth(), onClick = onOpen) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(order.customerName, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                Text(order.customerPhone, style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.muted)
                Text(
                    "${order.brand} ${order.productName.ifBlank { order.modelName }}".trim(),
                    style = MaterialTheme.typography.bodySmall,
                    color = Tokens.muted,
                )
                specs?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.muted) }
                Text(ago, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            }
            Spacer(Modifier.width(Tokens.Space.gap))
            StatusChip(t(orderStatusLabelKey(order.statusCode), null), color = orderStatusColor(order.statusCode))
        }
    }
}
