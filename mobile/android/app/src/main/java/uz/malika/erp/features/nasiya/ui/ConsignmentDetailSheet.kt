package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.nasiya.data.ConsignmentViewDto
import uz.malika.erp.features.nasiya.data.money
import uz.malika.erp.features.nasiya.model.daysOverdue
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Read-only consignment detail (from the already-loaded row) + OUT actions.
 * [onViewDevice] opens the device in inventory; [onViewSale] (null unless the
 * consignment resolved into a sale) opens that sale — both via cross-feature nav.
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

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(t("consignments.detailTitle", null), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                StatusChip(item.statusCode, color = consignmentStatusColor(item.statusCode))
            }
            DetailRow(t("consignments.partner", null), item.partnerShopName.ifBlank { "—" })
            DetailRow(t("consignments.device", null), item.imei, mono = true)
            item.imei2?.takeIf { it.isNotBlank() }?.let {
                DetailRow(t("inventory.imei2", null), it, mono = true)
            }
            DetailRow(t("consignments.agreedPrice", null), formatMoney(item.agreedPrice.money()), mono = true)
            DetailRow(
                t("consignments.dueDate", null),
                item.dueDate.take(10) + if (overdue > 0) " · $overdue ${t("consignments.daysOverdue", null)}" else "",
            )
            DetailRow(t("consignments.consignedAt", null), item.consignedAt.take(10))
            item.resolvedAt?.let { DetailRow(t("consignments.resolvedAt", null), it.take(10)) }
            item.notes?.let { DetailRow(t("common.notes", null), it) }

            Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                PillButton(t("consignments.openDevice", null), onClick = onViewDevice, variant = ButtonVariant.OUTLINE)
                onViewSale?.let {
                    PillButton(t("consignments.resultingSale", null), onClick = it, variant = ButtonVariant.OUTLINE)
                }
            }

            if (item.statusCode == "OUT") {
                Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    PillButton(t("consignments.settle", null), onClick = onSettle)
                    PillButton(t("consignments.return", null), onClick = onReturn, variant = ButtonVariant.OUTLINE)
                }
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String, mono: Boolean = false) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = Tokens.mutedForeground)
        val style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium)
        Text(value, style = if (mono) style.copy(fontFamily = MonoFamily) else style)
    }
}
