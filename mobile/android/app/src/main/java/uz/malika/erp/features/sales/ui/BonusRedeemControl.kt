package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.sales.lib.fromCents
import uz.malika.erp.features.sales.model.PosState
import uz.malika.erp.features.sales.model.PosViewModel
import uz.malika.erp.features.sales.model.setBonusRequested
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatPoints
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Lets the cashier spend a customer's bonus points on this cart (ADR 0043).
 * Shown only when the plan's max is above 0. Offline, with a cached customer
 * balance above 0, it shows a single "need a connection" line instead.
 */
@Composable
fun BonusRedeemControl(
    state: PosState,
    vm: PosViewModel,
    online: Boolean,
) {
    val t = LocalT.current
    val max = state.bonusPlan.maxCents.fromCents()
    if (max.signum() <= 0) return

    val balance = state.customerBonus?.balance
    Column(Modifier.fillMaxWidth()) {
        if (!online && balance != null && balance.signum() > 0) {
            Text(t("pos.bonusOffline", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.warning)
        } else {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(t("pos.bonusBalance", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
                Text(formatPoints(balance?.toPlainString()), style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.text)
            }
            Spacer(Modifier.height(4.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(t("pos.bonusMax", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
                Text(formatPoints(max.toPlainString()), style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.text)
            }
            Spacer(Modifier.height(8.dp))
            AppFormField(
                label = t("pos.bonusAmount", null),
                value = state.bonusRequested.toPlainString(),
                onValueChange = { vm.setBonusRequested(parseMoney(it)) },
                keyboardType = KeyboardType.Number,
            )
            Spacer(Modifier.height(8.dp))
            PillButton(
                text = t("pos.bonusUseMax", null),
                onClick = { vm.setBonusRequested(max) },
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
