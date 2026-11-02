package uz.malika.erp.features.finance.ui.expenses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.finance.data.ExpenseSummary
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.MoneyText

/** Total-expenses card with a per-category breakdown (`/expenses/summary`). */
@Composable
fun ExpenseSummaryCard(summary: ExpenseSummary?) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth()) {
        Text(t("expenses.summaryTitle", null), style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(4.dp))
        Text(formatMoney(summary?.total ?: "0"), style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(12.dp))
        summary?.byCategory?.forEach { row ->
            Row(
                Modifier.fillMaxWidth().padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(row.name, style = MaterialTheme.typography.bodyMedium)
                MoneyText(row.total, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}
