package uz.malika.erp.shared.payments.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.i18n.Translate
import uz.malika.erp.shared.payments.AccountOption
import uz.malika.erp.shared.payments.AccountsApi
import uz.malika.erp.shared.payments.AccountsRepository
import uz.malika.erp.shared.payments.accountLabelKey
import uz.malika.erp.shared.ui.AppSelect

/** A display label for an account code: its i18n key, else the server label, else the code. */
fun accountLabel(code: String, options: List<AccountOption>, t: Translate): String =
    accountLabelKey(code)?.let { t(it, null) }
        ?: options.firstOrNull { it.code == code }?.label?.ifBlank { null }
        ?: code

/**
 * The account options for the current user, fetched once. `balance.read` → the
 * live `/ledger/balances` accounts; otherwise the CASH/CARD fallback. A failed
 * fetch also falls back, so a picker always has at least two choices.
 */
@Composable
fun rememberAccountOptions(container: AppContainer): State<List<AccountOption>> {
    val canRead = LocalCan.current("balance.read")
    val repo = remember { AccountsRepository(container.retrofit.create(AccountsApi::class.java)) }
    return produceState(initialValue = AccountOption.FALLBACK, canRead) {
        value = runCatching { repo.options(canRead) }.getOrDefault(AccountOption.FALLBACK)
    }
}

/**
 * The one account picker used everywhere money moves (expenses, partner payments,
 * shipments, the split rows). A labelled [AppSelect] over [options]; the value is
 * the selected code (never null — default CASH is set by the caller).
 */
@Composable
fun AccountPicker(
    label: String,
    selected: String,
    options: List<AccountOption>,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val t = LocalT.current
    AppSelect(
        value = options.firstOrNull { it.code == selected } ?: AccountOption(selected),
        options = options,
        optionLabel = { accountLabel(it.code, options, t) },
        onSelect = { onSelect(it?.code ?: selected) },
        modifier = modifier,
        label = label,
        enabled = enabled,
    )
}
