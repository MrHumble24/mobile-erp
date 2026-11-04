package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import uz.malika.erp.features.finance.data.DailyClosingReport
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.model.isoDate
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.features.finance.ui.components.BarChart
import uz.malika.erp.features.finance.ui.components.BarDatum
import uz.malika.erp.features.finance.ui.components.DateField
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.shared.ui.signTint
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import java.util.Date

/** Daily register closing: pick a date → that day's figures + consignment movement. */
@Composable
fun DailyClosingTab(vm: FinanceReadsViewModel) {
    val t = LocalT.current
    var date by remember { mutableStateOf(Date()) }
    val handle = rememberAsync(date) { vm.dailyClosing(isoDate(date)) }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        DateField(t("reports.selectDate", null), date, onChanged = { date = it })
        AsyncContent(handle, retryLabel = t("common.retry", null)) { r -> Body(r) }
    }
}

@Composable
private fun Body(r: DailyClosingReport) {
    val t = LocalT.current
    MetricGrid(
        tiles = listOf(
            { m ->
                MetricTile(
                    t("dashboard.revenue", null), r.revenue, m,
                    subtext = "${r.unitsSold} ${t("dashboard.unitsSold", null)}",
                )
            },
            { m -> MetricTile(t("dashboard.grossProfit", null), r.grossProfit, m, emphasis = signTint(r.grossProfit)) },
            { m -> MetricTile(t("dashboard.expenses", null), r.expenses, m) },
            { m ->
                MetricTile(
                    t("nav.consignments", null),
                    "+${r.newConsignments} / -${r.settledConsignments}",
                    m, money = false,
                )
            },
        ),
    )
    BarChart(
        title = t("reports.closingReport", null),
        data = listOf(
            BarDatum(t("dashboard.revenue", null), parseMoney(r.revenue).toDouble()),
            BarDatum(t("dashboard.grossProfit", null), parseMoney(r.grossProfit).toDouble()),
            BarDatum(t("dashboard.expenses", null), parseMoney(r.expenses).toDouble()),
        ),
    )
}
