package uz.malika.erp.features.repairs.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.repairs.data.RepairRepository
import uz.malika.erp.features.repairs.data.RepairView
import uz.malika.erp.features.repairs.lib.RepairStatus
import uz.malika.erp.features.repairs.model.RepairDetailViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatDate
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

private enum class MoneyKind { PAYMENT, REFUND, OUTSIDE }

/** One repair ticket in full (ADR 0040): header, money, legal status moves, parts, payments, history. */
@Composable
fun RepairDetailSheet(container: AppContainer, repo: RepairRepository, id: String) {
    val t = LocalT.current
    val vm: RepairDetailViewModel = viewModel(key = "repair-$id", factory = viewModelFactory { initializer { RepairDetailViewModel(repo, id) } })
    val state by vm.state.collectAsState()
    val canManage = LocalCan.current("repair.manage")
    val canPay = LocalCan.current("repair.payment")

    var money by remember { mutableStateOf<MoneyKind?>(null) }
    var statusNote by remember { mutableStateOf<String?>(null) } // the target status awaiting a note

    val repair = state.repair
    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
        when {
            state.loading -> Loading()
            repair == null -> Text(state.error ?: t("common.error", null), color = Tokens.danger)
            else -> {
                Header(repair)
                Spacer(Modifier.height(Tokens.Space.md))
                RepairMoneySummary(repair)
                Spacer(Modifier.height(Tokens.Space.md))
                if (canManage) StatusActions(repair, enabled = !state.busy) { to ->
                    val needsNote = to == RepairStatus.CANCELLED || (to == RepairStatus.GIVEN_BACK && parseMoney(repair.outstanding).signum() > 0)
                    if (needsNote) statusNote = to else vm.changeStatus(to, null)
                }
                Spacer(Modifier.height(Tokens.Space.md))
                RepairPartsSection(container, repair.parts, canManage, enabled = !state.busy, onAdd = { m, q -> vm.addPart(m, q) }, onRemove = { vm.removePart(it) })
                Spacer(Modifier.height(Tokens.Space.md))
                if (canPay) MoneyActions(repair, enabled = !state.busy) { money = it }
                Spacer(Modifier.height(Tokens.Space.md))
                RepairPaymentsList(repair.payments)
                Spacer(Modifier.height(Tokens.Space.md))
                RepairStatusHistory(repair.statusHistory)
                state.error?.let { Spacer(Modifier.height(Tokens.Space.sm)); Text(it, color = Tokens.danger, style = MaterialTheme.typography.bodySmall) }
            }
        }
    }

    money?.let { kind ->
        uz.malika.erp.shared.ui.AppBottomSheet(onDismiss = { money = null }) {
            RepairMoneySheet(
                container = container,
                title = t(moneyTitleKey(kind), null),
                busy = state.busy,
                error = null,
                maxAmount = if (kind == MoneyKind.REFUND) repair?.paid?.let { parseMoney(it) } else null,
            ) { amount, account ->
                when (kind) {
                    MoneyKind.PAYMENT -> vm.addPayment(amount, account) { money = null }
                    MoneyKind.REFUND -> vm.refund(amount, account) { money = null }
                    MoneyKind.OUTSIDE -> vm.outsidePayment(amount, account) { money = null }
                }
            }
        }
    }

    statusNote?.let { to ->
        val reasonKey = if (to == RepairStatus.CANCELLED) "repairs.cancelNote" else "repairs.giveBackReason"
        StatusNoteDialog(
            title = t(RepairStatus.labelKey(to), null),
            label = t(reasonKey, null),
            busy = state.busy,
            onConfirm = { note -> vm.changeStatus(to, note) { statusNote = null } },
            onDismiss = { statusNote = null },
        )
    }
}

private fun moneyTitleKey(kind: MoneyKind): String = when (kind) {
    MoneyKind.PAYMENT -> "repairs.takePayment"
    MoneyKind.REFUND -> "repairs.refund"
    MoneyKind.OUTSIDE -> "repairs.outsidePayment"
}

@Composable
private fun Header(repair: RepairView) {
    val t = LocalT.current
    Text(t("repairs.ticket", mapOf("number" to repair.ticketNumber)), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
    Spacer(Modifier.height(Tokens.Space.rowV))
    Row(horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
        StatusChip(t(RepairStatus.labelKey(repair.statusCode), null), color = repairStatusColor(repair.statusCode))
        if (repair.underWarranty) StatusChip(t("repairs.underWarranty", null), color = Tokens.success)
    }
    Spacer(Modifier.height(Tokens.Space.sm))
    Text("${repair.customer.name} · ${repair.deviceName}", style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
    repair.imei?.takeIf { it.isNotBlank() }?.let { Text(it, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted) }
    Text(repair.problem, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
    repair.master?.let { m ->
        val who = if (m.kind == "OWN") "${t("repairs.ownMaster", null)}: ${m.name}" else "${t("repairs.outsideMaster", null)}: ${m.name}"
        Text(who, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
    }
    repair.warrantyUntil?.let { Text("${t("repairs.warrantyUntil", null)}: ${formatDate(it)}", style = MaterialTheme.typography.bodySmall, color = Tokens.muted) }
}

/** The legal next-status buttons (ADR 0040); none shown for a terminal ticket. */
@Composable
private fun StatusActions(repair: RepairView, enabled: Boolean, onMove: (String) -> Unit) {
    val t = LocalT.current
    val moves = RepairStatus.legalMoves(repair.statusCode)
    if (moves.isEmpty()) return
    Column(Modifier.fillMaxWidth()) {
        Text(t("repairs.changeStatus", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.sm))
        moves.forEach { to ->
            PillButton(t(RepairStatus.labelKey(to), null), { onMove(to) }, Modifier.fillMaxWidth(), variant = ButtonVariant.OUTLINE, enabled = enabled)
            Spacer(Modifier.height(Tokens.Space.rowV))
        }
    }
}

@Composable
private fun MoneyActions(repair: RepairView, enabled: Boolean, onPick: (MoneyKind) -> Unit) {
    val t = LocalT.current
    Column(Modifier.fillMaxWidth()) {
        PillButton(t("repairs.takePayment", null), { onPick(MoneyKind.PAYMENT) }, Modifier.fillMaxWidth(), enabled = enabled)
        if (parseMoney(repair.paid).signum() > 0) {
            Spacer(Modifier.height(Tokens.Space.rowV))
            PillButton(t("repairs.refund", null), { onPick(MoneyKind.REFUND) }, Modifier.fillMaxWidth(), variant = ButtonVariant.OUTLINE, enabled = enabled)
        }
        if (repair.master?.kind == "OUTSIDE") {
            Spacer(Modifier.height(Tokens.Space.rowV))
            PillButton(t("repairs.outsidePayment", null), { onPick(MoneyKind.OUTSIDE) }, Modifier.fillMaxWidth(), variant = ButtonVariant.OUTLINE, enabled = enabled)
        }
    }
}
