package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
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
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * One consignment card: partner, mono IMEI(s), due date (danger when overdue)
 * left; mono price and status pill right; settle / return as quiet pills on an
 * OUT row (the one orange stays on the screen's new-consignment action).
 */
@Composable
fun ConsignmentCard(
    item: ConsignmentViewDto,
    onOpenDetail: () -> Unit,
    onSettle: () -> Unit,
    onReturn: () -> Unit,
) {
    val t = LocalT.current
    val overdue = daysOverdue(item.dueDate, item.statusCode)
    AppCard(Modifier.fillMaxWidth(), onClick = onOpenDetail) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(item.partnerShopName.ifBlank { "—" }, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                Text(item.imei, style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.text)
                item.imei2?.takeIf { it.isNotBlank() }?.let {
                    Text(it, style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.muted)
                }
                Text(
                    if (overdue > 0) "${formatDate(item.dueDate)} · $overdue ${t("consignments.daysOverdue", null)}"
                    else "${t("consignments.dueDate", null)}: ${formatDate(item.dueDate)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (overdue > 0) Tokens.danger else Tokens.muted,
                )
            }
            Spacer(Modifier.width(Tokens.Space.gap))
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(Tokens.Space.xs)) {
                MoneyText(item.agreedPrice.money(), style = MaterialTheme.typography.titleSmall.copy(color = Tokens.text))
                StatusChip(consignmentStatusLabel(item.statusCode, t), color = consignmentStatusColor(item.statusCode))
            }
        }
        if (item.statusCode == "OUT") {
            Spacer(Modifier.height(Tokens.Space.md))
            Row(horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
                PillButton(t("consignments.settle", null), onClick = onSettle, variant = ButtonVariant.SECONDARY, modifier = Modifier.weight(1f))
                PillButton(t("consignments.return", null), onClick = onReturn, variant = ButtonVariant.SECONDARY, modifier = Modifier.weight(1f))
            }
        }
    }
}
