package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.finance.data.ExpenseReportRow
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.model.isoDate
import uz.malika.erp.features.finance.ui.components.AppSelectField
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.features.finance.ui.components.BarChart
import uz.malika.erp.features.finance.ui.components.BarDatum
import uz.malika.erp.features.finance.ui.components.SelectOption
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppDataTable
import uz.malika.erp.shared.ui.EmptyView
import java.math.BigDecimal
import java.util.Date

/** Expense analysis: date range + group-by (category/month) → chart + table. */
@Composable
fun ExpensesReportTab(vm: FinanceReadsViewModel) {
    val t = LocalT.current
    var from by remember { mutableStateOf<Date?>(null) }
    var to by remember { mutableStateOf<Date?>(null) }
    var groupBy by remember { mutableStateOf("category") }
    val handle = rememberAsync(from, to, groupBy) {
        vm.expenseReport(from?.let(::isoDate), to?.let(::isoDate), groupBy)
    }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        ReportDateRow(from, to, onFrom = { from = it }, onTo = { to = it }) {
            AppSelectField(
                label = t("reports.groupBy", null),
                options = listOf(
                    SelectOption("category", t("reports.groupByCategory", null)),
                    SelectOption("month", t("reports.groupByMonth", null)),
                ),
                selected = groupBy,
                onSelect = { groupBy = it },
                modifier = Modifier.width(190.dp),
            )
        }
        AsyncContent(handle, retryLabel = t("common.retry", null)) { rows -> Body(rows) }
    }
}

@Composable
private fun Body(rows: List<ExpenseReportRow>) {
    val t = LocalT.current
    if (rows.isEmpty()) {
        EmptyView(t("reports.empty", null))
        return
    }
    val total = rows.fold(BigDecimal.ZERO) { acc, r -> acc + parseMoney(r.total) }
    BarChart(
        title = t("reports.tabExpenses", null),
        data = rows.map { BarDatum(it.label, parseMoney(it.total).toDouble()) },
    )
    AppDataTable(
        columns = listOf(t("expenses.category", null), t("common.amount", null)),
        rows = rows,
        columnWidths = listOf(200, 140),
        cell = { r, c -> if (c == 0) r.label else formatMoney(r.total) },
    )
    Text(
        "${t("common.total", null)}: ${formatMoney(total.toPlainString())}",
        style = MaterialTheme.typography.titleMedium,
        textAlign = TextAlign.End,
        modifier = Modifier.fillMaxWidth(),
    )
}
