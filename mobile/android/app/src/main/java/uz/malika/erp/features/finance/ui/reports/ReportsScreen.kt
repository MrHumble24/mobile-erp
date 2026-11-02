package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.HorizontalDivider
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.AppContainer
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.ui.components.financeViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

private enum class ReportTab { PROFIT, EXPENSES, PRICING, CLOSING }

/**
 * Financial reports (perm `report.finance`): Profit / Expenses / Model pricing
 * / Daily closing tabs. A scrollable pill tab bar replaces the web's TabBar so
 * the long Uzbek labels fit on a phone.
 */
@Composable
fun ReportsScreen(container: AppContainer) {
    val t = LocalT.current
    val vm = financeViewModel(container) { FinanceReadsViewModel(it) }
    var tab by remember { mutableStateOf(ReportTab.PROFIT) }

    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            TabChip(t("reports.tabProfit", null), tab == ReportTab.PROFIT) { tab = ReportTab.PROFIT }
            TabChip(t("reports.tabExpenses", null), tab == ReportTab.EXPENSES) { tab = ReportTab.EXPENSES }
            TabChip(t("reports.tabModelPricing", null), tab == ReportTab.PRICING) { tab = ReportTab.PRICING }
            TabChip(t("reports.tabDailyClosing", null), tab == ReportTab.CLOSING) { tab = ReportTab.CLOSING }
        }
        HorizontalDivider(color = Tokens.border)
        when (tab) {
            ReportTab.PROFIT -> ProfitTab(vm)
            ReportTab.EXPENSES -> ExpensesReportTab(vm)
            ReportTab.PRICING -> ModelPricingTab(vm)
            ReportTab.CLOSING -> DailyClosingTab(vm)
        }
    }
}

@Composable
private fun TabChip(label: String, selected: Boolean, onClick: () -> Unit) {
    PillButton(label, onClick, variant = if (selected) ButtonVariant.DEFAULT else ButtonVariant.GHOST)
}
