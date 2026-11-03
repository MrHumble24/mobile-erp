package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.app.Destination
import uz.malika.erp.features.finance.data.BreakdownRow
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.ui.components.AppSelectField
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.features.finance.ui.components.BreakdownBars
import uz.malika.erp.features.finance.ui.components.BreakdownDatum
import uz.malika.erp.features.finance.ui.components.SelectOption
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney

/** Sales breakdown by channel / model / cashier / day. Model rows drill down. */
@Composable
fun SalesTab(
    vm: FinanceReadsViewModel,
    fromIso: String?,
    toIso: String?,
    onDrill: (ReportDrill) -> Unit,
) {
    val t = LocalT.current
    var groupBy by remember { mutableStateOf("model") }
    val handle = rememberAsync(fromIso, toIso, groupBy) { vm.profitBreakdown(fromIso, toIso, groupBy) }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        AppSelectField(
            label = t("reports.breakdownBy", null),
            options = listOf("channel", "model", "cashier", "day").map {
                SelectOption(it, t("reports.group_$it", null))
            },
            selected = groupBy,
            onSelect = { groupBy = it },
            modifier = Modifier.width(200.dp),
        )
        AsyncContent(handle, retryLabel = t("common.retry", null)) { rows ->
            if (groupBy == "model") {
                ModelMeasureTable(rows = rows, onRow = { onDrill(modelDrill(it, t)) })
            } else {
                BreakdownBars(
                    title = t("reports.salesBreakdownTitle", null),
                    rows = rows.map { BreakdownDatum(it.key, it.label, parseMoney(it.revenue).toDouble(), it.share) },
                    formatValue = ::moneyOf,
                )
            }
        }
    }
}

/** Drill for one model's sales: revenue / COGS / gross / units + jump to inventory. */
private fun modelDrill(row: BreakdownRow, t: (String, Map<String, Any?>?) -> String) =
    ReportDrill(
        title = row.label,
        lines = listOf(
            DrillLine(t("dashboard.revenue", null), moneyOf(parseMoney(row.revenue).toDouble())),
            DrillLine(t("dashboard.cogs", null), moneyOf(parseMoney(row.cogs).toDouble())),
            DrillLine(t("dashboard.grossProfit", null), moneyOf(parseMoney(row.grossProfit).toDouble())),
            DrillLine(t("dashboard.unitsSold", null), row.unitsSold.toString()),
            DrillLine(t("reports.share", null), "${"%.1f".format(row.share * 100)}%"),
        ),
        destination = Destination.Inventory(),
        actionLabel = t("nav.inventory", null),
    )
