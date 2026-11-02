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
import uz.malika.erp.features.finance.data.ExpenseReportRow
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.ui.components.AppSelectField
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.features.finance.ui.components.BreakdownBars
import uz.malika.erp.features.finance.ui.components.BreakdownDatum
import uz.malika.erp.features.finance.ui.components.SelectOption
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney

/** Expense analysis over the shared range: group by category or month → bars. */
@Composable
fun ExpensesReportTab(
    vm: FinanceReadsViewModel,
    fromIso: String?,
    toIso: String?,
    onDrill: (ReportDrill) -> Unit,
) {
    val t = LocalT.current
    var groupBy by remember { mutableStateOf("category") }
    val handle = rememberAsync(fromIso, toIso, groupBy) { vm.expenseReport(fromIso, toIso, groupBy) }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        AppSelectField(
            label = t("reports.breakdownBy", null),
            options = listOf(
                SelectOption("category", t("reports.groupByCategory", null)),
                SelectOption("month", t("reports.groupByMonth", null)),
            ),
            selected = groupBy,
            onSelect = { groupBy = it },
            modifier = Modifier.width(200.dp),
        )
        AsyncContent(handle, retryLabel = t("common.retry", null)) { rows ->
            val total = rows.sumOf { parseMoney(it.total).toDouble() }.coerceAtLeast(1.0)
            BreakdownBars(
                title = if (groupBy == "category") t("reports.expenseByCategory", null) else t("reports.expenseBy_month", null),
                rows = rows.map {
                    val value = parseMoney(it.total).toDouble()
                    BreakdownDatum(it.key, it.label, value, value / total)
                },
                formatValue = ::moneyOf,
                onSelect = if (groupBy == "category") {
                    { datum -> rows.firstOrNull { it.key == datum.key }?.let { onDrill(categoryDrill(it, total, t)) } }
                } else {
                    null
                },
            )
        }
    }
}

private fun categoryDrill(row: ExpenseReportRow, total: Double, t: (String, Map<String, Any?>?) -> String): ReportDrill {
    val value = parseMoney(row.total).toDouble()
    return ReportDrill(
        title = row.label,
        lines = listOf(
            DrillLine(t("common.amount", null), moneyOf(value)),
            DrillLine(t("reports.share", null), "${"%.1f".format(value / total * 100)}%"),
        ),
    )
}
