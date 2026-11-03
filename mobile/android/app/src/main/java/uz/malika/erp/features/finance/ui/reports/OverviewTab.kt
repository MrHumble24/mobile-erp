package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.finance.data.ProfitReport
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.features.finance.ui.components.BreakdownBars
import uz.malika.erp.features.finance.ui.components.BreakdownDatum
import uz.malika.erp.features.finance.ui.components.TrendLineChart
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.shared.ui.signedEmphasis
import uz.malika.erp.ui.theme.Tokens

/** Overview: P&L tiles (tap → P&L-components drill) + trend chart + channel split. */
@Composable
fun OverviewTab(
    vm: FinanceReadsViewModel,
    fromIso: String?,
    toIso: String?,
    bucket: String,
    onDrill: (ReportDrill) -> Unit,
    onReturns: (String?, String?) -> Unit,
    onNoi: (ProfitReport) -> Unit,
) {
    val t = LocalT.current
    val profit = rememberAsync(fromIso, toIso) { vm.profit(fromIso, toIso) }
    val trend = rememberAsync(fromIso, toIso, bucket) { vm.trend(fromIso, toIso, bucket) }
    val channel = rememberAsync(fromIso, toIso) { vm.profitBreakdown(fromIso, toIso, "channel") }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        AsyncContent(profit, retryLabel = t("common.retry", null)) { r ->
            Tiles(r, onDrill, onReturns = { onReturns(fromIso, toIso) }, onNoi = { onNoi(r) })
        }
        AsyncContent(trend, retryLabel = t("common.retry", null)) { points ->
            TrendLineChart(t("reports.trendTitle", null), points)
        }
        AsyncContent(channel, retryLabel = t("common.retry", null)) { rows ->
            BreakdownBars(
                title = t("reports.channelSplit", null),
                rows = rows.map { BreakdownDatum(it.key, it.label, parseMoney(it.revenue).toDouble(), it.share) },
                formatValue = ::moneyOf,
            )
        }
    }
}

@Composable
private fun Tiles(
    r: ProfitReport,
    onDrill: (ReportDrill) -> Unit,
    onReturns: () -> Unit,
    onNoi: () -> Unit,
) {
    val t = LocalT.current
    val drill = profitDrill(t("reports.breakdownHint", null), r, t)
    fun tile(
        label: String,
        value: String,
        emphasis: androidx.compose.ui.graphics.Color? = null,
        money: Boolean = true,
        onTap: () -> Unit = { onDrill(drill) },
    ): @Composable (Modifier) -> Unit = { m ->
        MetricTile(label, value, m.clickable(onClick = onTap), emphasis = emphasis, money = money)
    }
    MetricGrid(
        tiles = listOf(
            tile(t("dashboard.revenue", null), r.revenue),
            tile(t("dashboard.cogs", null), r.cogs),
            tile(t("dashboard.grossProfit", null), r.grossProfit),
            tile(t("dashboard.expenses", null), r.expenses, emphasis = Tokens.danger),
            tile(t("dashboard.netOperatingIncome", null), r.netOperatingIncome, emphasis = signedEmphasis(r.netOperatingIncome), onTap = onNoi),
            tile(t("dashboard.returnsRefunded", null), r.returnsRefunded, onTap = onReturns),
            tile(t("dashboard.unitsSold", null), r.unitsSold.toString(), money = false),
        ),
    )
}

/** P&L-components drill: where every headline figure comes from. */
private fun profitDrill(title: String, r: ProfitReport, t: (String, Map<String, Any?>?) -> String) =
    ReportDrill(
        title = title,
        lines = listOf(
            DrillLine(t("dashboard.revenue", null), formatMoney(r.revenue)),
            DrillLine(t("dashboard.retail", null), formatMoney(r.byChannel.retail)),
            DrillLine(t("dashboard.b2b", null), formatMoney(r.byChannel.b2b)),
            DrillLine(t("dashboard.cogs", null), formatMoney(r.cogs)),
            DrillLine(t("dashboard.grossProfit", null), formatMoney(r.grossProfit)),
            DrillLine(t("dashboard.expenses", null), formatMoney(r.expenses)),
            DrillLine(t("dashboard.netOperatingIncome", null), formatMoney(r.netOperatingIncome)),
            DrillLine(t("dashboard.returnsRefunded", null), formatMoney(r.returnsRefunded)),
            DrillLine(t("dashboard.unitsSold", null), r.unitsSold.toString()),
        ),
    )
