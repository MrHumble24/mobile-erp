package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.nasiya.data.ConsignmentViewDto
import uz.malika.erp.features.nasiya.data.money
import uz.malika.erp.features.nasiya.model.daysOverdue
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** One consignment row: partner, IMEI, price, due/overdue, status, actions. */
@Composable
fun ConsignmentCard(
    item: ConsignmentViewDto,
    onOpenDetail: () -> Unit,
    onSettle: () -> Unit,
    onReturn: () -> Unit,
) {
    val t = LocalT.current
    val overdue = daysOverdue(item.dueDate, item.statusCode)
    AppCard(onClick = onOpenDetail) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(item.partnerShopName.ifBlank { "—" }, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Text(item.imei, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.mutedForeground)
            }
            StatusChip(statusLabel(item.statusCode, t), color = consignmentStatusColor(item.statusCode))
        }

        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            MoneyText(item.agreedPrice.money(), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
            Column(horizontalAlignment = Alignment.End) {
                Text("${t("consignments.dueDate", null)}: ${item.dueDate.take(10)}", style = MaterialTheme.typography.bodySmall, color = Tokens.mutedForeground)
                if (overdue > 0) {
                    Text("$overdue ${t("consignments.daysOverdue", null)}", style = MaterialTheme.typography.labelMedium, color = Tokens.destructive, fontWeight = FontWeight.Bold)
                }
            }
        }

        if (item.statusCode == "OUT") {
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                PillButton(t("consignments.settle", null), onClick = onSettle)
                PillButton(t("consignments.return", null), onClick = onReturn, variant = ButtonVariant.OUTLINE)
            }
        }
    }
}

private fun statusLabel(code: String, t: (String, Map<String, Any?>?) -> String): String = when (code) {
    "OUT" -> t("consignments.statusOut", null)
    "SETTLED" -> t("consignments.statusSettled", null)
    "RETURNED" -> t("consignments.statusReturned", null)
    else -> code
}
