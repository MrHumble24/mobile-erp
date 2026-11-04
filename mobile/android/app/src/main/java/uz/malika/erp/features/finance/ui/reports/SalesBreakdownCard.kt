package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import uz.malika.erp.app.Destination
import uz.malika.erp.features.finance.data.BreakdownRow
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.features.finance.ui.components.BreakdownDatum
import uz.malika.erp.features.finance.ui.components.BreakdownRows
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens

/**
 * Sales breakdown by model / channel / cashier / day inside one card: the
 * group-by segmented control, then ranked bars (the model view ranks on the
 * gross-profit ↔ units measure toggle). Model rows drill down.
 */
@Composable
fun SalesBreakdownCard(vm: FinanceReadsViewModel, fromIso: String?, toIso: String?, onDrill: (ReportDrill) -> Unit) {
    val t = LocalT.current
    var groupBy by remember { mutableStateOf("model") }
    val handle = rememberAsync(fromIso, toIso, groupBy) { vm.profitBreakdown(fromIso, toIso, groupBy) }
    AppCard(Modifier.fillMaxWidth()) {
        Text(t("reports.salesBreakdownTitle", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.md))
        SegmentedControl(
            options = listOf("model", "channel", "cashier", "day").map { SegmentOption(it, t("reports.group_$it", null)) },
            selected = groupBy,
            onSelect = { groupBy = it },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(Tokens.Space.md))
        AsyncContent(handle, retryLabel = t("common.retry", null)) { rows ->
            if (groupBy == "model") {
                ModelMeasureRows(rows = rows, onRow = { onDrill(modelDrill(it, t)) })
            } else {
                BreakdownRows(
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
