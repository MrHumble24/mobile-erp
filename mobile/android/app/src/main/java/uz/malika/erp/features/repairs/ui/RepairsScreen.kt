package uz.malika.erp.features.repairs.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.repairs.data.RepairApi
import uz.malika.erp.features.repairs.data.RepairListItem
import uz.malika.erp.features.repairs.data.RepairRepository
import uz.malika.erp.features.repairs.lib.RepairStatus
import uz.malika.erp.features.repairs.model.RepairsListViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatDate
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppDateRangeField
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** Repairs (More tab, ADR 0040): status/date/search filters, the finance report, tickets, new ticket. */
@Composable
fun RepairsScreen(container: AppContainer) {
    val t = LocalT.current
    val repo = remember { RepairRepository(container.retrofit.create(RepairApi::class.java)) }
    val vm: RepairsListViewModel = viewModel(factory = viewModelFactory { initializer { RepairsListViewModel(repo) } })
    val status by vm.status.collectAsState()
    val range by vm.range.collectAsState()
    val search by vm.search.collectAsState()
    val state by vm.state.collectAsState()
    val canManage = LocalCan.current("repair.manage")

    var detailId by remember { mutableStateOf<String?>(null) }
    var createOpen by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize().padding(horizontal = Tokens.Space.screenH)) {
        Spacer(Modifier.height(Tokens.Space.md))
        if (canManage && !state.disabled) {
            PillButton(t("repairs.newTicket", null), { createOpen = true }, Modifier.fillMaxWidth())
            Spacer(Modifier.height(Tokens.Space.sm))
        }
        when {
            state.loading -> Loading()
            state.disabled -> EmptyView(t("repairs.disabled", null))
            state.error != null -> ErrorView(state.error!!, retryLabel = t("common.retry", null), onRetry = vm::refresh)
            else -> {
                AppSelect(
                    value = status,
                    options = RepairStatus.ALL,
                    optionLabel = { t(RepairStatus.labelKey(it), null) },
                    onSelect = { vm.setStatus(it) },
                    label = null,
                    nullOption = t("repairs.allStatuses", null),
                )
                Spacer(Modifier.height(Tokens.Space.sm))
                AppDateRangeField(t("common.date", null), range, onPick = { vm.setRange(it) })
                Spacer(Modifier.height(Tokens.Space.sm))
                AppTextField(value = search, onValueChange = { vm.setSearch(it) }, placeholder = t("repairs.searchHint", null), imeAction = ImeAction.Search)
                Spacer(Modifier.height(Tokens.Space.sm))
                state.report?.let { RepairReportCard(it) }
                if (state.items.isEmpty()) {
                    EmptyView(t("repairs.empty", null))
                } else {
                    LazyColumn(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
                        items(state.items, key = { it.id }) { row -> RepairRow(row, onOpen = { detailId = row.id }) }
                    }
                }
            }
        }
    }

    detailId?.let { id ->
        AppBottomSheet(onDismiss = { detailId = null; vm.refresh() }) {
            RepairDetailSheet(container, repo, id)
        }
    }
    if (createOpen) {
        AppBottomSheet(onDismiss = { createOpen = false }) {
            CreateRepairSheet(container, repo, onCreated = { createOpen = false; container.toaster.success(t("repairs.createSuccess", null)); vm.refresh() })
        }
    }
}

@Composable
private fun RepairReportCard(report: uz.malika.erp.features.repairs.data.RepairReport) {
    val t = LocalT.current
    val mono = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily, color = Tokens.text)
    AppCard(Modifier.fillMaxWidth()) {
        Text(t("repairs.report", null), style = MaterialTheme.typography.titleSmall, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.rowV))
        ReportRow(t("repairs.income", null), report.income, mono)
        report.partsCost?.let { ReportRow(t("repairs.partsCost", null), it, mono) }
        report.outsideCost?.let { ReportRow(t("repairs.outsidePaid", null), it, mono) }
        report.profit?.let { ReportRow(t("repairs.profit", null), it, mono) }
    }
}

@Composable
private fun ReportRow(label: String, value: String, style: androidx.compose.ui.text.TextStyle) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
        MoneyText(value, style = style)
    }
}

@Composable
private fun RepairRow(row: RepairListItem, onOpen: () -> Unit) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth(), onClick = onOpen) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(t("repairs.ticket", mapOf("number" to row.ticketNumber)), style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                Text("${row.customer.name} · ${row.deviceName}", style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                Text(formatDate(row.receivedAt), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            }
            Column(horizontalAlignment = Alignment.End) {
                StatusChip(t(RepairStatus.labelKey(row.statusCode), null), color = repairStatusColor(row.statusCode))
                if (uz.malika.erp.shared.lib.parseMoney(row.outstanding).signum() > 0) {
                    MoneyText(row.outstanding, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily, color = Tokens.danger))
                }
            }
        }
    }
}
