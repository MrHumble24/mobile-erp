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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.nasiya.data.ConsignmentTab
import uz.malika.erp.features.nasiya.data.ConsignmentViewDto
import uz.malika.erp.features.nasiya.data.money
import uz.malika.erp.features.nasiya.model.ConsignmentsViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.ui.theme.Tokens

/**
 * Consignments with Out / Overdue / Settled / Returned / All tabs + search.
 * Each OUT row offers settle and return; `consignment.create` holders can
 * consign a device. Offline writes are parked in the outbox (pending marker).
 */
@Composable
fun ConsignmentsScreen(container: AppContainer) {
    val t = LocalT.current
    val can = LocalCan.current
    val vm: ConsignmentsViewModel = viewModel(
        factory = viewModelFactory { initializer { ConsignmentsViewModel(container) } },
    )
    val state by vm.state.collectAsState()
    val tab by vm.tab.collectAsState()
    val search by vm.search.collectAsState()
    val pending by vm.pendingCount.collectAsState()

    var createOpen by remember { mutableStateOf(false) }
    var detailFor by remember { mutableStateOf<ConsignmentViewDto?>(null) }
    var settleFor by remember { mutableStateOf<ConsignmentViewDto?>(null) }
    var returnFor by remember { mutableStateOf<ConsignmentViewDto?>(null) }

    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(t("consignments.title", null), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            if (can("consignment.create")) {
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

        when {
            state.loading -> Loading()
            state.error != null -> ErrorView(state.error!!, retryLabel = t("common.retry", null), onRetry = vm::refresh)
            state.items.isEmpty() -> EmptyView(t("consignments.noConsignmentsFound", null))
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(state.items, key = { it.id }) { item ->
                    ConsignmentCard(
                        item = item,
                        onOpenDetail = { detailFor = item },
                        onSettle = { settleFor = item },
                        onReturn = { returnFor = item },
                    )
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
        )
    }
    settleFor?.let { c -> SettleConsignmentSheet(container, c) { settleFor = null; vm.refresh() } }
    returnFor?.let { c -> ReturnConsignmentSheet(container, c) { returnFor = null; vm.refresh() } }
}
