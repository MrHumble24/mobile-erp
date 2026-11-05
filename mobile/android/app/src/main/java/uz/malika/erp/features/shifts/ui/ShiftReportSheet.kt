package uz.malika.erp.features.shifts.ui

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
import androidx.compose.ui.Modifier
import uz.malika.erp.features.balance.model.ledgerAccountKey
import uz.malika.erp.features.balance.model.ledgerTypeKey
import uz.malika.erp.features.shifts.data.ShiftReportView
import uz.malika.erp.features.shifts.data.ShiftTypeGroup
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatDateTime
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.FactRow
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** The shift report (ADR 0036): opening, expected, counted, difference, card, movements. */
@Composable
fun ShiftReportSheet(report: ShiftReportView) {
    val t = LocalT.current
    val mono = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily, color = Tokens.text)

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
        Text(report.cashier.name, style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        Text(
            "${t("shifts.openedAt", null)}: ${formatDateTime(report.openedAt)}",
            style = MaterialTheme.typography.bodySmall, color = Tokens.muted,
        )
        report.closedAt?.let { Text("${t("shifts.closedAt", null)}: ${formatDateTime(it)}", style = MaterialTheme.typography.bodySmall, color = Tokens.muted) }
        Spacer(Modifier.height(Tokens.Space.lg))

        FactRow(t("shifts.openingCash", null)) { MoneyText(report.openingCount, style = mono) }
        FactRow(t("shifts.expectedCash", null)) { MoneyText(report.expectedCash, style = mono) }
        report.countedCash?.let { FactRow(t("shifts.countedCash", null)) { MoneyText(it, style = mono) } }
        report.difference?.let { diff ->
            val color = when (parseMoney(diff).signum()) { 0 -> Tokens.success; -1 -> Tokens.danger; else -> Tokens.warning }
            FactRow(t("shifts.difference", null)) { MoneyText(diff, style = mono.copy(color = color)) }
        }
        FactRow(t("shifts.cardTotal", null), last = true) { MoneyText(report.cardTotal, style = mono) }
        report.note?.takeIf { it.isNotBlank() }?.let {
            Spacer(Modifier.height(Tokens.Space.sm))
            Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        }

        if (report.byType.isNotEmpty()) {
            Spacer(Modifier.height(Tokens.Space.lg))
            Text(t("shifts.report", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
            Spacer(Modifier.height(Tokens.Space.sm))
            AppCard(Modifier.fillMaxWidth()) { report.byType.forEach { TypeRow(it) } }
        }
        Spacer(Modifier.height(Tokens.Space.sm))
    }
}

@Composable
private fun TypeRow(group: ShiftTypeGroup) {
    val t = LocalT.current
    val label = ledgerTypeKey(group.typeCode)?.let { t(it, null) } ?: group.typeCode
    Column(Modifier.fillMaxWidth().padding(vertical = Tokens.Space.rowV)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("$label (${group.count})", style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
            MoneyText(group.total, style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily, color = Tokens.text))
        }
        group.byAccount.forEach { a ->
            val acc = ledgerAccountKey(a.accountCode)?.let { t(it, null) } ?: a.accountCode
            Row(Modifier.fillMaxWidth().padding(start = Tokens.Space.md), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("$acc (${a.count})", style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                MoneyText(a.total, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily, color = Tokens.muted))
            }
        }
    }
}
