package uz.malika.erp.features.finance.ui.expenses

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.features.finance.data.ExpenseSummary
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile

/** Period total plus the per-category breakdown as one list-card (`/expenses/summary`). */
@Composable
fun ExpenseSummaryCard(summary: ExpenseSummary?, modifier: Modifier = Modifier) {
    val t = LocalT.current
    val tiles = buildList<@Composable (Modifier) -> Unit> {
        add { m -> MetricTile(t("expenses.metricTotal", null), formatMoney(summary?.total ?: "0"), m, money = false) }
        summary?.byCategory?.forEach { row ->
            add { m -> MetricTile(row.name, formatMoney(row.total), m, money = false) }
        }
    }
    MetricGrid(tiles = tiles, modifier = modifier, perRow = 2)
}
