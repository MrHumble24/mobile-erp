package uz.malika.erp.features.sales.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.features.sales.data.SaleStats
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.ui.theme.Tokens

/** Stats tiles for the sales list (mirrors the web SalesSummary). Profit is shown only when present (not redacted). */
@Composable
fun SalesSummary(stats: SaleStats, modifier: Modifier = Modifier) {
    val t = LocalT.current
    val tiles = buildList<@Composable (Modifier) -> Unit> {
        add { m -> MetricTile(t("sales.statsCount", null), stats.count.toString(), m, money = false) }
        add { m -> MetricTile(t("sales.statsRevenue", null), stats.revenue, m) }
        add { m -> MetricTile(t("sales.statsAvgPrice", null), stats.avgPrice, m) }
        add { m ->
            MetricTile(
                t("sales.statsReturns", null),
                stats.returnedCount.toString(),
                m,
                subtext = "${t("sales.statsRefundTotal", null)}: ${stats.refundTotal}",
                money = false,
            )
        }
        stats.netProfit?.let { profit ->
            add { m -> MetricTile(t("sales.statsNetProfit", null), profit, m, emphasis = Tokens.success) }
        }
    }
    MetricGrid(tiles, modifier, perRow = 2)
}
