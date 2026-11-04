package uz.malika.erp.features.nasiya.ui

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
import uz.malika.erp.data.local.PartnerEntity
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.MonoFamily
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
    AppCard(Modifier.fillMaxWidth(), onClick = onOpenLedger) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(partner.shopName, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                Text(partner.phone ?: "—", style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted)
            }
            Spacer(Modifier.width(Tokens.Space.gap))
            Column(horizontalAlignment = Alignment.End) {
                MoneyText(partner.outstanding, style = MaterialTheme.typography.titleMedium.copy(color = Tokens.text))
                Text(t("partners.outstanding", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            }
        }

        Spacer(Modifier.height(Tokens.Space.md))
        CreditBar(partner.creditLimit, partner.outstanding)

        if (canPay) {
            Spacer(Modifier.height(Tokens.Space.md))
            PillButton(
                text = t("partners.recordPayment", null),
                onClick = onRecordPayment,
                variant = ButtonVariant.SECONDARY,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
