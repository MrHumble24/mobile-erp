package uz.malika.erp.features.nasiya.ui

import uz.malika.erp.features.nasiya.data.code

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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.features.nasiya.data.ConsignmentViewDto
import uz.malika.erp.features.nasiya.data.money
import uz.malika.erp.features.nasiya.model.daysOverdue
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatDate
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.shared.ui.FactRow
import uz.malika.erp.ui.theme.Tokens

/**
 * Consignment detail as a Warm Card sheet: partner title + status pill, mono
 * IMEI lines, keyed facts, then ghost links (device, resulting sale) and — on
 * an OUT item — settle (the one orange) / return (destructive). Mirrors iOS.
 */
@Composable
fun ConsignmentDetailSheet(
    item: ConsignmentViewDto,
    onDismiss: () -> Unit,
    onSettle: () -> Unit,
    onReturn: () -> Unit,
    onViewDevice: () -> Unit,
    onViewSale: (() -> Unit)?,
) {
    val t = LocalT.current
    val overdue = daysOverdue(item.dueDate, item.statusCode)
    val mono = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily, color = Tokens.text)
    val plain = MaterialTheme.typography.bodyMedium.copy(color = Tokens.text)

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
            Text(item.partnerShopName.ifBlank { t("consignments.detailTitle", null) }, style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            Spacer(Modifier.height(Tokens.Space.sm))
            Text(item.code, style = mono)
            item.imei2?.takeIf { it.isNotBlank() }?.let { Text(it, style = mono.copy(color = Tokens.muted)) }
            Spacer(Modifier.height(Tokens.Space.sm))
            StatusChip(consignmentStatusLabel(item.statusCode, t), color = consignmentStatusColor(item.statusCode))
            Spacer(Modifier.height(Tokens.Space.lg))

            FactRow(t("consignments.agreedPrice", null)) { MoneyText(item.agreedPrice.money(), style = plain) }
            FactRow(t("consignments.dueDate", null)) {
                Column(horizontalAlignment = Alignment.End) {
                    Text(formatDate(item.dueDate), style = mono.copy(color = if (overdue > 0) Tokens.danger else Tokens.text))
                    if (overdue > 0) {
                        Text("$overdue ${t("consignments.daysOverdue", null)}", style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
                    }
                }
            }
            FactRow(t("consignments.consignedAt", null), last = item.resolvedAt == null && item.notes.isNullOrBlank()) {
                Text(formatDate(item.consignedAt), style = mono)
            }
            item.resolvedAt?.let { FactRow(t("consignments.resolvedAt", null), last = item.notes.isNullOrBlank()) { Text(formatDate(it), style = mono) } }
            item.notes?.takeIf { it.isNotBlank() }?.let { FactRow(t("common.notes", null), last = true) { Text(it, style = plain) } }

            Spacer(Modifier.height(Tokens.Space.lg))
            Column(verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
                PillButton(t("consignments.openDevice", null), onClick = onViewDevice, variant = ButtonVariant.GHOST, modifier = Modifier.fillMaxWidth())
                onViewSale?.let {
                    PillButton(t("consignments.resultingSale", null), onClick = it, variant = ButtonVariant.GHOST, modifier = Modifier.fillMaxWidth())
                }
                if (item.statusCode == "OUT") {
                    PillButton(t("consignments.settle", null), onClick = onSettle, modifier = Modifier.fillMaxWidth())
                    PillButton(t("consignments.return", null), onClick = onReturn, variant = ButtonVariant.DESTRUCTIVE, modifier = Modifier.fillMaxWidth())
                }
            }
            Spacer(Modifier.height(Tokens.Space.sm))
        }
    }
}
