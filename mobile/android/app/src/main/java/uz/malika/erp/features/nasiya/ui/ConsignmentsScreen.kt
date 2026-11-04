package uz.malika.erp.features.nasiya.ui

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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import uz.malika.erp.AppContainer
import uz.malika.erp.app.Destination
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.nasiya.data.ConsignmentViewDto
import uz.malika.erp.features.nasiya.data.money
import uz.malika.erp.features.nasiya.model.ConsignmentsViewModel
import uz.malika.erp.features.nasiya.model.consignmentCsvRows
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.Csv
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.shareTextFile
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.shared.ui.SearchFilterRow
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.shared.ui.listBottomPadding
import uz.malika.erp.ui.theme.Tokens

/**
 * Consignments: a status chip row (All / Out / Overdue / Settled / Returned,
 * the open and overdue chips carrying their live counts), inline search beside
 * the filter button, new-consignment and CSV as icon actions, the summary
 * list-card, then one card per row. Each OUT row offers settle/return;
 * `consignment.create` holders can consign. Offline writes park in the outbox
 * (pending pill). The detail sheet links to the device and the resulting sale.
 */
@Composable
fun ConsignmentsScreen(container: AppContainer) {
    val t = LocalT.current
    val can = LocalCan.current
    val context = LocalContext.current
    val vm: ConsignmentsViewModel = viewModel(
        factory = viewModelFactory { initializer { ConsignmentsViewModel(container) } },
    )
    val state by vm.state.collectAsState()
    val tab by vm.tab.collectAsState()
    val search by vm.search.collectAsState()
    val range by vm.range.collectAsState()
    val pending by vm.pendingCount.collectAsState()
    val deepLinked by vm.deepLinked.collectAsState()

    var showFilters by remember { mutableStateOf(false) }
    var createOpen by remember { mutableStateOf(false) }
    var detailFor by remember { mutableStateOf<ConsignmentViewDto?>(null) }
    var settleFor by remember { mutableStateOf<ConsignmentViewDto?>(null) }
    var returnFor by remember { mutableStateOf<ConsignmentViewDto?>(null) }

    // Cross-feature deep link: open the requested consignment once.
    LaunchedEffect(Unit) {
        container.featureNav.consumeArg(Destination.Consignments().route)?.let { vm.openById(it) }
    }
    LaunchedEffect(deepLinked) {
        deepLinked?.let { detailFor = it; vm.clearDeepLink() }
    }

    val activeFilters = if (range.startMillis != null || range.endMillis != null) 1 else 0

    Column(Modifier.fillMaxSize()) {
        Spacer(Modifier.height(Tokens.Space.md))
        StatusTabChips(tab, state.stats?.openCount, state.stats?.overdueCount, vm::setTab)
        Spacer(Modifier.height(Tokens.Space.md))
        Row(
            Modifier.fillMaxWidth().padding(horizontal = Tokens.Space.screenH),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            SearchFilterRow(
                query = search,
                onQueryChange = vm::setSearch,
                placeholder = t("consignments.searchPlaceholder", null),
                activeCount = activeFilters,
                onOpenFilters = { showFilters = true },
                modifier = Modifier.weight(1f),
            )
            if (can("consignment.create")) {
                IconButton(onClick = { createOpen = true }) {
                    Icon(Icons.Outlined.Add, contentDescription = t("consignments.newConsignment", null), tint = Tokens.text)
                }
            }
            ConsignmentsOverflowMenu(csvEnabled = state.page.items.isNotEmpty()) {
                val headers = listOf(
                    t("consignments.partner", null),
                    t("consignments.device", null),
                    t("consignments.agreedPrice", null),
                    t("consignments.dueDate", null),
                    t("common.status", null),
                    t("consignments.daysOverdue", null),
                )
                val csv = Csv.build(headers, consignmentCsvRows(state.page.items))
                shareTextFile(context, "consignments.csv", csv, chooserTitle = t("consignments.exportCsv", null))
            }
        }

        LazyColumn(
            contentPadding = PaddingValues(start = Tokens.Space.screenH, end = Tokens.Space.screenH, top = Tokens.Space.md, bottom = Tokens.Space.lg),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg),
        ) {
            if (pending > 0) {
                item { StatusChip("${t("common.loading", null)} · $pending", color = Tokens.warning) }
            }
            state.stats?.let { s ->
                item {
                    MetricGrid(
                        perRow = 3,
                        tiles = listOf(
                            { m -> MetricTile(t("consignments.statsOpen", null), s.openCount.toString(), m, money = false) },
                            { m -> MetricTile(t("consignments.statsOutstanding", null), formatMoney(s.outstanding.money()), m, money = false) },
                            { m ->
                                MetricTile(
                                    t("consignments.statsOverdue", null), s.overdueCount.toString(), m, money = false,
                                    emphasis = if (s.overdueCount > 0) Tokens.danger else null,
                                )
                            },
                        ),
                    )
                }
            }
            when {
                state.loading -> item { Box(Modifier.fillMaxWidth().height(160.dp)) { Loading() } }
                state.error != null -> item {
                    Box(Modifier.fillMaxWidth().height(200.dp)) {
                        ErrorView(state.error!!, retryLabel = t("common.retry", null), onRetry = vm::refresh)
                    }
                }
                state.page.items.isEmpty() -> item {
                    AppCard(Modifier.fillMaxWidth()) { EmptyView(t("consignments.noConsignmentsFound", null), compact = true) }
                }
                else -> {
                    items(state.page.items, key = { it.id }) { item ->
                        ConsignmentCard(
                            item = item,
                            onOpenDetail = { detailFor = item },
                            onSettle = { settleFor = item },
                            onReturn = { returnFor = item },
                        )
                    }
                    item { LoadMoreFooter(state.page.hasMore, state.page.loading, onLoadMore = vm::loadMore) }
                }
            }
        }
    }

    if (showFilters) {
        ConsignmentFilterSheet(
            range = range,
            onRange = vm::setRange,
            canReset = activeFilters > 0 || search.isNotBlank(),
            onReset = vm::clearFilters,
            onDismiss = { showFilters = false },
        )
    }
    if (createOpen) ConsignDeviceSheet(container, lockedPartnerId = null, lockedPartnerName = null) {
        createOpen = false
        vm.refresh()
    }
    detailFor?.let { c ->
        ConsignmentDetailSheet(
            item = c,
            onDismiss = { detailFor = null },
            onSettle = { detailFor = null; settleFor = c },
            onReturn = { detailFor = null; returnFor = c },
            onViewDevice = { detailFor = null; container.featureNav.open(Destination.Inventory(c.imei)) },
            onViewSale = c.saleId?.let { sid -> { detailFor = null; container.featureNav.open(Destination.Sales(sid)) } },
        )
    }
    settleFor?.let { c -> SettleConsignmentSheet(container, c) { settleFor = null; vm.refresh() } }
    returnFor?.let { c -> ReturnConsignmentSheet(container, c) { returnFor = null; vm.refresh() } }
}
