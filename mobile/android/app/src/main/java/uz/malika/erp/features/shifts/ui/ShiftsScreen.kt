package uz.malika.erp.features.shifts.ui

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
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import kotlinx.coroutines.launch
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.shifts.data.ShiftApi
import uz.malika.erp.features.shifts.data.ShiftListItem
import uz.malika.erp.features.shifts.data.ShiftReportView
import uz.malika.erp.features.shifts.data.ShiftRepository
import uz.malika.erp.features.shifts.model.ShiftsListViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatDateTime
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppDateRangeField
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/** Shifts list (More tab, ADR 0036): date + cashier (manage only) filters, report, force-close. */
@Composable
fun ShiftsScreen(container: AppContainer) {
    val t = LocalT.current
    val repo = remember { ShiftRepository(container.retrofit.create(ShiftApi::class.java), container.secure) }
    val vm: ShiftsListViewModel = viewModel(factory = viewModelFactory { initializer { ShiftsListViewModel(repo) } })
    val range by vm.range.collectAsState()
    val cashierId by vm.cashierId.collectAsState()
    val state by vm.state.collectAsState()
    val canManage = LocalCan.current("shift.manage")
    val scope = rememberCoroutineScope()

    var reportId by remember { mutableStateOf<String?>(null) }
    var forceClose by remember { mutableStateOf<ShiftListItem?>(null) }
    var forceBusy by remember { mutableStateOf(false) }
    var forceError by remember { mutableStateOf<String?>(null) }

    // Cashier options come from the loaded rows (no users() call / permission needed).
    val cashiers = remember(state.items) { state.items.map { it.cashier }.distinctBy { it.id } }

    Column(Modifier.fillMaxSize().padding(horizontal = Tokens.Space.screenH)) {
        Spacer(Modifier.height(Tokens.Space.md))
        AppDateRangeField(t("common.date", null), range, onPick = { vm.setRange(it) })
        if (canManage && cashiers.isNotEmpty()) {
            Spacer(Modifier.height(Tokens.Space.sm))
            AppSelect(
                value = cashiers.firstOrNull { it.id == cashierId },
                options = cashiers,
                optionLabel = { it.name },
                onSelect = { vm.setCashier(it?.id) },
                label = t("shifts.cashier", null),
                nullOption = t("shifts.allShifts", null),
            )
        }
        Spacer(Modifier.height(Tokens.Space.sm))
        when {
            state.loading -> Loading()
            state.error != null -> ErrorView(state.error!!, retryLabel = t("common.retry", null), onRetry = vm::refresh)
            state.items.isEmpty() -> EmptyView(t("shifts.noShifts", null))
            else -> LazyColumn(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
                items(state.items, key = { it.id }) { row ->
                    ShiftRow(row, canManage, onOpen = { reportId = row.id }, onForceClose = { forceClose = row })
                }
            }
        }
    }

    reportId?.let { id ->
        AppBottomSheet(onDismiss = { reportId = null }) {
            val report by produceState<ShiftReportView?>(null, id) { value = runCatching { repo.report(id) }.getOrNull() }
            report?.let { ShiftReportSheet(it) } ?: Loading()
        }
    }

    forceClose?.let { row ->
        ForceCloseSheet(
            cashierName = row.cashier.name,
            submitting = forceBusy,
            error = forceError,
            onSubmit = { count, note ->
                forceBusy = true; forceError = null
                scope.launch {
                    runCatching { repo.forceClose(row.id, count, note) }
                        .onSuccess { forceBusy = false; forceClose = null; vm.refresh() }
                        .onFailure { forceBusy = false; forceError = (it as? uz.malika.erp.core.AppException)?.message ?: it.message }
                }
            },
            onDismiss = { forceClose = null; forceError = null },
        )
    }
}

@Composable
private fun ShiftRow(row: ShiftListItem, canManage: Boolean, onOpen: () -> Unit, onForceClose: () -> Unit) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth(), onClick = onOpen) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(row.cashier.name, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                Text(formatDateTime(row.openedAt), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                if (row.open) {
                    StatusChip(t("shifts.stillOpen", null), color = Tokens.warning)
                } else {
                    row.difference?.takeIf { parseMoney(it).signum() != 0 }?.let {
                        MoneyText(it, style = MaterialTheme.typography.bodySmall.copy(color = if (parseMoney(it).signum() < 0) Tokens.danger else Tokens.success))
                    }
                }
            }
            if (row.open && canManage) {
                PillButton(t("shifts.forceClose", null), onForceClose, variant = ButtonVariant.OUTLINE)
            }
        }
    }
}
