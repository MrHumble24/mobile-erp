package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.finance.data.ProfitReport
import uz.malika.erp.features.finance.model.DashPeriod
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.model.isoDate
import uz.malika.erp.features.finance.model.periodStart
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.features.finance.ui.components.BarChart
import uz.malika.erp.features.finance.ui.components.BarDatum
import uz.malika.erp.features.finance.ui.components.MetricGrid
import uz.malika.erp.features.finance.ui.components.MetricTile
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.ui.theme.Tokens
import java.util.Date

/** Profit & Loss: date range → KPI tiles + a channel/profit bar chart. */
@Composable
fun ProfitTab(vm: FinanceReadsViewModel) {
    val t = LocalT.current
    var from by remember { mutableStateOf(periodStart(DashPeriod.MONTH)) }
    var to by remember { mutableStateOf(Date()) }
    val handle = rememberAsync(from, to) { vm.profit(isoDate(from), isoDate(to)) }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        ReportDateRow(from, to, onFrom = { from = it }, onTo = { to = it })
        AsyncContent(handle, retryLabel = t("common.retry", null)) { r -> ProfitBody(r) }
    }
}

@Composable
private fun ProfitBody(r: ProfitReport) {
    val t = LocalT.current
    MetricGrid(
        tiles = listOf(
            { m ->
                MetricTile(
                    t("dashboard.revenue", null), r.revenue, m,
                    subtext = "${t("dashboard.retail", null)}: ${formatMoney(r.byChannel.retail)}",
                )
            },
            { m ->
                MetricTile(
                    t("dashboard.cogs", null), r.cogs, m,
                    subtext = "${r.unitsSold} ${t("dashboard.unitsSold", null)}",
                )
            },
            { m -> MetricTile(t("dashboard.grossProfit", null), r.grossProfit, m) },
            { m -> MetricTile(t("dashboard.expenses", null), r.expenses, m, emphasis = Tokens.danger) },
            { m -> MetricTile(t("dashboard.netOperatingIncome", null), r.netOperatingIncome, m, emphasis = Tokens.success) },
        ),
    )
    BarChart(
        title = t("dashboard.byChannel", null),
        data = listOf(
            BarDatum(t("dashboard.retail", null), parseMoney(r.byChannel.retail).toDouble()),
            BarDatum(t("dashboard.b2b", null), parseMoney(r.byChannel.b2b).toDouble()),
            BarDatum(t("dashboard.grossProfit", null), parseMoney(r.grossProfit).toDouble()),
            BarDatum(t("dashboard.netOperatingIncome", null), parseMoney(r.netOperatingIncome).toDouble()),
        ),
    )
}

/** Shared from/to date picker row for the report tabs. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ReportDateRow(
    from: Date?,
    to: Date?,
    onFrom: (Date) -> Unit,
    onTo: (Date) -> Unit,
    trailing: @Composable () -> Unit = {},
) {
    val t = LocalT.current
    FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        uz.malika.erp.features.finance.ui.components.DateField(t("reports.dateFrom", null), from, onFrom)
        uz.malika.erp.features.finance.ui.components.DateField(t("reports.dateTo", null), to, onTo)
        trailing()
    }
}
