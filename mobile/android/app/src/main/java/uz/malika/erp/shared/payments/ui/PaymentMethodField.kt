package uz.malika.erp.shared.payments.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.payments.AccountAmount
import uz.malika.erp.shared.payments.AccountOption
import uz.malika.erp.shared.payments.PaymentMethod
import uz.malika.erp.shared.payments.PaymentSplit
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens
import java.math.BigDecimal

/** The checkout tender choice: a method and, for a split, the per-account text. */
data class PaymentSelection(
    val method: PaymentMethod = PaymentMethod.CASH,
    val amounts: Map<String, String> = emptyMap(),
) {
    /** The cart-level parts for [total] over [accounts] (zero parts dropped). */
    fun parts(total: BigDecimal, accounts: List<AccountOption>): List<AccountAmount> =
        PaymentSplit.parts(
            method = method,
            total = total,
            splitAmounts = amounts.mapValues { parseMoney(it.value) },
            accounts = accounts.map { it.code },
        )

    /** Still-to-assign for [total]; zero when a split adds up (always zero off-split). */
    fun remaining(total: BigDecimal, accounts: List<AccountOption>): BigDecimal =
        if (method == PaymentMethod.SPLIT) PaymentSplit.remaining(total, parts(total, accounts)) else BigDecimal.ZERO

    /** A split that does not add up cannot be confirmed. */
    fun valid(total: BigDecimal, accounts: List<AccountOption>): Boolean =
        remaining(total, accounts).signum() == 0
}

/**
 * The one Cash / Card / Split control used at checkout. Split shows one amount
 * per account and a live "left to assign" figure; the caller blocks confirm until
 * [PaymentSelection.valid]. Render + dispatch only — state lives in the caller.
 */
@Composable
fun PaymentMethodField(
    selection: PaymentSelection,
    onSelection: (PaymentSelection) -> Unit,
    accounts: List<AccountOption>,
    total: BigDecimal,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val t = LocalT.current
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
        Text(t("balance.paidWith", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        SegmentedControl(
            options = listOf(
                SegmentOption(PaymentMethod.CASH, t("balance.payCash", null)),
                SegmentOption(PaymentMethod.CARD, t("balance.payCard", null)),
                SegmentOption(PaymentMethod.SPLIT, t("balance.paySplit", null)),
            ),
            selected = selection.method,
            onSelect = { if (enabled) onSelection(selection.copy(method = it)) },
        )
        if (selection.method == PaymentMethod.SPLIT) {
            accounts.forEach { account ->
                AppFormField(
                    label = accountLabel(account.code, accounts, t),
                    value = selection.amounts[account.code].orEmpty(),
                    onValueChange = { text ->
                        onSelection(selection.copy(amounts = selection.amounts + (account.code to text)))
                    },
                    keyboardType = KeyboardType.Decimal,
                    enabled = enabled,
                )
            }
            val remaining = selection.remaining(total, accounts)
            val settled = remaining.signum() == 0
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(t("balance.splitRemaining", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
                MoneyText(
                    remaining.toPlainString(),
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontFamily = MonoFamily,
                        color = if (settled) Tokens.success else Tokens.danger,
                    ),
                )
            }
            if (!settled) {
                Text(t("balance.errorSplitTotal", null), style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
            }
        }
    }
}
