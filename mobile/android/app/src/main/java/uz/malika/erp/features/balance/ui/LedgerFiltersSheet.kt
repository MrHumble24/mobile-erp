package uz.malika.erp.features.balance.ui

import androidx.compose.runtime.Composable
import uz.malika.erp.features.balance.data.LedgerAccount
import uz.malika.erp.features.balance.data.LedgerFilter
import uz.malika.erp.features.balance.model.LEDGER_FILTER_TYPES
import uz.malika.erp.features.balance.model.ledgerAccountKey
import uz.malika.erp.features.balance.model.ledgerTypeKey
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.i18n.Translate
import uz.malika.erp.shared.ui.AppDateRangeField
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.FilterSheet

/**
 * History filters: account, type and date range. Each control applies
 * immediately through the callback; the From/To pair is one range field (the kit
 * ships no split single-date input). Codes resolve to i18n labels, server label
 * as the fallback.
 */
@Composable
fun LedgerFiltersSheet(
    accounts: List<LedgerAccount>,
    filter: LedgerFilter,
    range: DateRange,
    onAccount: (String?) -> Unit,
    onType: (String?) -> Unit,
    onRange: (DateRange) -> Unit,
    canReset: Boolean,
    onReset: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    FilterSheet(title = t("common.filter", null), onDismiss = onDismiss, canReset = canReset, onReset = onReset) {
        AppSelect(
            value = filter.accountCode,
            options = accounts.map { it.accountCode },
            optionLabel = { code -> accountLabel(code, accounts, t) },
            onSelect = onAccount,
            label = t("balance.filterAccount", null),
            nullOption = t("balance.allAccounts", null),
        )
        AppSelect(
            value = filter.typeCode,
            options = LEDGER_FILTER_TYPES,
            optionLabel = { code -> ledgerTypeKey(code)?.let { t(it, null) } ?: code },
            onSelect = onType,
            label = t("balance.filterType", null),
            nullOption = t("balance.allTypes", null),
        )
        AppDateRangeField(label = t("balance.date", null), range = range, onPick = onRange)
    }
}

/** A label for an account code: the i18n key, else the server-supplied label, else the code. */
internal fun accountLabel(code: String, accounts: List<LedgerAccount>, t: Translate): String =
    ledgerAccountKey(code)?.let { t(it, null) }
        ?: accounts.firstOrNull { it.accountCode == code }?.label?.ifBlank { null }
        ?: code
