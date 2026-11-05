package uz.malika.erp.features.repairs.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.features.balance.model.ledgerAccountKey
import uz.malika.erp.features.repairs.data.RepairPaymentDto
import uz.malika.erp.features.repairs.data.RepairStatusHistoryDto
import uz.malika.erp.features.repairs.data.RepairView
import uz.malika.erp.features.repairs.lib.RepairStatus
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatDateTime
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.FactRow
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

private val mono @Composable get() = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily, color = Tokens.text)

/** Money summary (ADR 0040): agreed, paid, outstanding, and the cost figures when permitted. */
@Composable
fun RepairMoneySummary(repair: RepairView) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth()) {
        FactRow(t("repairs.agreedPrice", null)) { MoneyText(repair.agreedPrice, style = mono) }
        FactRow(t("repairs.paid", null)) { MoneyText(repair.paid, style = mono) }
        FactRow(t("repairs.outstanding", null), last = repair.partsCost == null) {
            MoneyText(repair.outstanding, style = mono.copy(color = if (parseMoney(repair.outstanding).signum() > 0) Tokens.danger else Tokens.text))
        }
        repair.partsCost?.let { FactRow(t("repairs.partsCost", null)) { MoneyText(it, style = mono) } }
        repair.outsidePaid?.let { FactRow(t("repairs.outsidePaid", null)) { MoneyText(it, style = mono) } }
        repair.profit?.let {
            FactRow(t("repairs.profit", null), last = true) {
                MoneyText(it, style = mono.copy(color = if (parseMoney(it).signum() < 0) Tokens.danger else Tokens.success))
            }
        }
    }
}

/** The ticket's payments (signed: a refund is negative). */
@Composable
fun RepairPaymentsList(payments: List<RepairPaymentDto>) {
    val t = LocalT.current
    Column(Modifier.fillMaxWidth()) {
        Text(t("repairs.payments", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.sm))
        if (payments.isEmpty()) {
            Text(t("repairs.noPayments", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        } else {
            AppCard(Modifier.fillMaxWidth()) {
                payments.forEach { p ->
                    val acc = ledgerAccountKey(p.accountCode)?.let { t(it, null) } ?: p.accountCode
                    FactRow("$acc · ${formatDateTime(p.occurredAt)}") {
                        MoneyText(p.amount, style = mono.copy(color = if (parseMoney(p.amount).signum() < 0) Tokens.danger else Tokens.text))
                    }
                }
            }
        }
    }
}

/** The status-change log, newest-first as the server returns it. */
@Composable
fun RepairStatusHistory(history: List<RepairStatusHistoryDto>) {
    val t = LocalT.current
    if (history.isEmpty()) return
    Column(Modifier.fillMaxWidth()) {
        Text(t("repairs.statusHistory", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.sm))
        AppCard(Modifier.fillMaxWidth()) {
            history.forEach { h ->
                FactRow(t(RepairStatus.labelKey(h.toStatusCode), null)) {
                    Text(formatDateTime(h.changedAt), style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted)
                }
                h.note?.takeIf { it.isNotBlank() }?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.muted, modifier = Modifier.padding(bottom = Tokens.Space.rowV))
                }
            }
        }
    }
}
