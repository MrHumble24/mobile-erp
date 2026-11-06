package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatPoints
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * The sale's points rows (ADR 0043), in the detail sheet's fact style: each
 * shown only when above zero, so a sale without points shows nothing new.
 */
@Composable
fun SaleBonusRows(spent: String?, earned: String?) {
    val t = LocalT.current
    if (parseMoney(spent).signum() > 0) {
        BonusFact(t("sales.paidWithPoints", null)) { Text("-" + formatPoints(spent), style = bonusValueStyle()) }
    }
    if (parseMoney(earned).signum() > 0) {
        BonusFact(t("sales.pointsEarned", null)) { Text(formatPoints(earned), style = bonusValueStyle()) }
    }
}

@Composable
private fun BonusFact(label: String, value: @Composable () -> Unit) {
    Column {
        Row(
            Modifier.fillMaxWidth().heightIn(min = Tokens.minTouch),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(label, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            Spacer(Modifier.weight(1f))
            value()
        }
        HorizontalDivider(color = Tokens.border)
    }
}

@Composable
private fun bonusValueStyle() =
    MaterialTheme.typography.bodyMedium.copy(color = Tokens.text, fontFamily = MonoFamily)
