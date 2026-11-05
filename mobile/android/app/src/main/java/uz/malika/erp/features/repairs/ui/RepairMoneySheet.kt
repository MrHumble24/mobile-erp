package uz.malika.erp.features.repairs.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import uz.malika.erp.AppContainer
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.payments.ui.AccountPicker
import uz.malika.erp.shared.payments.ui.rememberAccountOptions
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** A repair money entry (ADR 0040): an amount + an account, for a payment, refund or outside payment. */
@Composable
fun RepairMoneySheet(
    container: AppContainer,
    title: String,
    busy: Boolean,
    error: String?,
    maxAmount: java.math.BigDecimal? = null,
    onSubmit: (amount: Double, accountCode: String) -> Unit,
) {
    val t = LocalT.current
    val accounts by rememberAccountOptions(container)
    var amount by remember { mutableStateOf("") }
    var account by remember { mutableStateOf("CASH") }
    val amountNum = parseMoney(amount)
    val overCap = maxAmount != null && amountNum > maxAmount
    val ready = !busy && amountNum.signum() > 0 && !overCap

    Column(Modifier.fillMaxWidth().padding(Tokens.Space.gutter)) {
        Text(title, style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.lg))
        AppFormField(t("repairs.amount", null), amount, { amount = it }, keyboardType = KeyboardType.Decimal, enabled = !busy)
        if (overCap) {
            Spacer(Modifier.height(Tokens.Space.rowV))
            Text("${t("sales.refundTooHigh", null)} (${uz.malika.erp.shared.lib.formatMoney(maxAmount!!.toPlainString())})", style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
        }
        Spacer(Modifier.height(Tokens.Space.md))
        AccountPicker(label = t("repairs.account", null), selected = account, options = accounts, onSelect = { account = it }, enabled = !busy)
        Spacer(Modifier.height(Tokens.Space.md))
        error?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger); Spacer(Modifier.height(Tokens.Space.sm)) }
        PillButton(title, { onSubmit(amountNum.toDouble(), account) }, Modifier.fillMaxWidth(), enabled = ready)
        Spacer(Modifier.height(Tokens.Space.md))
    }
}
