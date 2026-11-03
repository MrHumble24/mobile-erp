package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.app.Destination
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.nasiya.data.ConsignmentTab
import uz.malika.erp.features.nasiya.data.ConsignmentViewDto
import uz.malika.erp.features.nasiya.data.money
import uz.malika.erp.features.nasiya.model.ConsignmentsViewModel
import uz.malika.erp.features.nasiya.model.consignmentCsvRows
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.Csv
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.shareTextFile
import uz.malika.erp.shared.ui.AppDateRangeField
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/**
 * Consignments with Out / Overdue / Settled / Returned / All tabs, search, a
 * date range, summary tiles and CSV export. Each OUT row offers settle/return;
 * `consignment.create` holders can consign a device. Offline writes are parked
 * in the outbox (pending marker). The detail sheet links to the device (POS /
 * inventory) and the resulting sale through cross-feature navigation.
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

    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (can("consignment.create")) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                PillButton(t("consignments.newConsignment", null), onClick = { createOpen = true })
            }
        }

        if (pending > 0) {
            StatusChip("${t("common.loading", null)} · $pending", color = Tokens.warning)
        }

        Row(Modifier.horizontalScroll(rememberScrollState())) {
            SegmentedControl(
                options = listOf(
                    SegmentOption(ConsignmentTab.ALL, t("common.all", null)),
                    SegmentOption(ConsignmentTab.OUT, t("consignments.statusOut", null)),
                    SegmentOption(ConsignmentTab.OVERDUE, t("consignments.statusOverdue", null)),
                    SegmentOption(ConsignmentTab.SETTLED, t("consignments.statusSettled", null)),
                    SegmentOption(ConsignmentTab.RETURNED, t("consignments.statusReturned", null)),
                ),
                selected = tab,
                onSelect = vm::setTab,
            )
        }

        AppTextField(
            value = search,
            onValueChange = vm::setSearch,
            placeholder = t("consignments.searchPlaceholder", null),
            leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null) },
        )

        AppDateRangeField(label = t("common.date", null), range = range, onPick = vm::setRange)

        state.stats?.let { s ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                MetricTile(t("consignments.statsOpen", null), s.openCount.toString(), money = false, modifier = Modifier.weight(1f))
                MetricTile(t("consignments.statsOutstanding", null), formatMoney(s.outstanding.money()), money = false, modifier = Modifier.weight(1f))
                MetricTile(
                    t("consignments.statsOverdue", null),
                    s.overdueCount.toString(),
                    money = false,
                    emphasis = if (s.overdueCount > 0) Tokens.destructive else null,
                    modifier = Modifier.weight(1f),
                )
            }
        }

        if (state.page.items.isNotEmpty()) {
            PillButton(
                t("consignments.exportCsv", null),
                onClick = {
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
                },
                variant = ButtonVariant.OUTLINE,
            )
        }

        when {
            state.loading -> Loading()
            state.error != null -> ErrorView(state.error!!, retryLabel = t("common.retry", null), onRetry = vm::refresh)
            state.page.items.isEmpty() -> EmptyView(t("consignments.noConsignmentsFound", null))
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(state.page.items, key = { it.id }) { item ->
                    ConsignmentCard(
                        item = item,
                        onOpenDetail = { detailFor = item },
                        onSettle = { settleFor = item },
                        onReturn = { returnFor = item },
                    )
                }
                item {
                    LoadMoreFooter(state.page.hasMore, state.page.loading, onLoadMore = vm::loadMore)
                }
            }
        }
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
