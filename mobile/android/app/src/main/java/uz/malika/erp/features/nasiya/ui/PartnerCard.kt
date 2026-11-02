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
import uz.malika.erp.data.local.PartnerEntity
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** One partner row: name/phone, credit bar, outstanding, ledger + pay actions. */
@Composable
fun PartnerCard(
    partner: PartnerEntity,
    canPay: Boolean,
    onOpenLedger: () -> Unit,
    onRecordPayment: () -> Unit,
) {
    val t = LocalT.current
    AppCard(onClick = onOpenLedger) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(partner.shopName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Text(
                    partner.phone ?: "—",
                    style = MaterialTheme.typography.bodySmall,
                    color = Tokens.mutedForeground,
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(t("partners.outstanding", null), style = MaterialTheme.typography.labelSmall, color = Tokens.mutedForeground)
                MoneyText(
                    partner.outstanding,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                )
            }
        }

        Spacer(Modifier.height(10.dp))
        CreditBar(partner.creditLimit, partner.outstanding)

        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            PillButton(
                text = t("partners.ledgerTitle", null),
                onClick = onOpenLedger,
                variant = ButtonVariant.OUTLINE,
            )
            if (canPay) {
                PillButton(text = t("partners.recordPayment", null), onClick = onRecordPayment)
            }
        }
    }
}
