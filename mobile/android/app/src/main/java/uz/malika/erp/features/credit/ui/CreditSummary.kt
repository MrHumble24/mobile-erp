package uz.malika.erp.features.credit.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.features.credit.data.CreditListItem
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.FactRow
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** Agreed / paid / left-to-pay facts, with overdue when any (ADR 0035). */
@Composable
fun CreditFacts(agreedTotal: String, paid: String, outstanding: String, overdueAmount: String, overpaid: String = "0") {
    val t = LocalT.current
    val mono = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily, color = Tokens.text)
    FactRow(t("credit.agreedTotal", null)) { MoneyText(agreedTotal, style = mono) }
    FactRow(t("credit.paid", null)) { MoneyText(paid, style = mono) }
    FactRow(t("credit.outstanding", null), last = parseMoney(overdueAmount).signum() <= 0 && parseMoney(overpaid).signum() <= 0) {
        MoneyText(outstanding, style = mono.copy(color = Tokens.text))
    }
    if (parseMoney(overdueAmount).signum() > 0) {
        FactRow(t("credit.overdueAmount", null), last = parseMoney(overpaid).signum() <= 0) {
            MoneyText(overdueAmount, style = mono.copy(color = Tokens.danger))
        }
    }
    if (parseMoney(overpaid).signum() > 0) {
        FactRow(t("credit.overpaid", null), last = true) { MoneyText(overpaid, style = mono.copy(color = Tokens.warning)) }
    }
}

/** One credit in a list: customer, agreed, left-to-pay, and a status badge. */
@Composable
fun CreditListRow(item: CreditListItem, onClick: () -> Unit) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth(), onClick = onClick) {
        Row(Modifier.fillMaxWidth()) {
            Column(Modifier.weight(1f)) {
                Text(item.customer.name, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                item.customer.phone?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted)
                }
                StatusBadge(item)
            }
            Column(horizontalAlignment = androidx.compose.ui.Alignment.End) {
                Text(t("credit.outstanding", null), style = MaterialTheme.typography.labelSmall, color = Tokens.muted)
                MoneyText(item.outstanding, style = MaterialTheme.typography.titleSmall.copy(color = Tokens.text))
            }
        }
    }
}

@Composable
private fun StatusBadge(item: CreditListItem) {
    val t = LocalT.current
    when {
        item.settled -> StatusChip(t("credit.settled", null), color = Tokens.success)
        parseMoney(item.overdueAmount).signum() > 0 -> StatusChip(t("credit.overdue", null), color = Tokens.danger)
        else -> StatusChip(t("credit.open", null), color = Tokens.slate)
    }
}
