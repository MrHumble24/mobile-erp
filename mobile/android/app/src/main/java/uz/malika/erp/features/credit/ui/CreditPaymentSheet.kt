package uz.malika.erp.features.credit.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
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
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.payments.PaymentSplit
import uz.malika.erp.shared.payments.ui.AccountPicker
import uz.malika.erp.shared.payments.ui.rememberAccountOptions
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/**
 * Take a payment / refund an overpayment on a credit (ADR 0035): an amount and a
 * cash/card account. [max] is the outstanding (payment) or overpaid (refund); the
 * server caps both, so the sheet only blocks an empty/zero amount.
 */
@Composable
fun CreditPaymentSheet(
    container: AppContainer,
    title: String,
    max: String,
    submitting: Boolean,
    error: String?,
    onSubmit: (amount: Double, accountCode: String) -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    var amount by remember { mutableStateOf("") }
    var account by remember { mutableStateOf(PaymentSplit.CASH) }
    val accounts by rememberAccountOptions(container)
    val value = amount.trim().toDoubleOrNull() ?: 0.0

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.fillMaxWidth().padding(Tokens.Space.gutter), verticalArrangement = Arrangement.spacedBy(Tokens.Space.md)) {
            Text(title, style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            Text("${t("credit.outstanding", null)}: ${formatMoney(max)}", style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            AppFormField(t("credit.amount", null), amount, { amount = it }, keyboardType = KeyboardType.Decimal, enabled = !submitting)
            AccountPicker(label = t("balance.payFrom", null), selected = account, options = accounts, onSelect = { account = it }, enabled = !submitting)
            error?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger) }
            PillButton(
                text = if (submitting) t("common.loading", null) else title,
                onClick = { if (value > 0.0) onSubmit(value, account) },
                enabled = !submitting && value > 0.0,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
