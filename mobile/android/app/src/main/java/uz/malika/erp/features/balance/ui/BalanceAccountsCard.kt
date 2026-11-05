package uz.malika.erp.features.balance.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import uz.malika.erp.features.balance.data.LedgerBalances
import uz.malika.erp.features.balance.model.ledgerAccountKey
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.ui.theme.Tokens

/**
 * One row per money account (cash, card) plus the total, as the One UI list-card
 * (`MetricGrid`). A balance below zero is tinted danger (DESIGN "below zero");
 * zero-or-above keeps the plain text colour — a positive balance is not a profit.
 */
@Composable
fun BalanceAccountsCard(balances: LedgerBalances?, modifier: Modifier = Modifier) {
    val t = LocalT.current
    val tiles = buildList<@Composable (Modifier) -> Unit> {
        balances?.accounts?.forEach { account ->
            val label = ledgerAccountKey(account.accountCode)?.let { t(it, null) } ?: account.label
            add { m -> MetricTile(label, account.balance, m, emphasis = belowZeroTint(account.balance)) }
        }
        add { m -> MetricTile(t("balance.total", null), balances?.total ?: "0", m, emphasis = belowZeroTint(balances?.total)) }
    }
    MetricGrid(tiles = tiles, modifier = modifier, perRow = 2)
}

/** Danger when the amount is negative, else null (plain text colour). */
@Composable
@ReadOnlyComposable
private fun belowZeroTint(value: String?): Color? =
    if (parseMoney(value).signum() < 0) Tokens.danger else null
