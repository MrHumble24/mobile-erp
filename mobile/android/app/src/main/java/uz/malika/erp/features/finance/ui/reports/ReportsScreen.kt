package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.model.bucketForRange
import uz.malika.erp.features.finance.model.defaultReportRangeMillis
import uz.malika.erp.features.finance.model.isoDate
import uz.malika.erp.features.finance.ui.components.financeViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppDateRangeField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

private enum class ReportTab(val labelKey: String, val ranged: Boolean) {
    OVERVIEW("reports.tab_overview", true),
    SALES("reports.tab_sales", true),
    EXPENSES("reports.tab_expenses", true),
    NASIYA("reports.tab_nasiya", true),
    INVENTORY("reports.tab_inventory", false),
    PRICING("reports.tab_pricing", false),
    CLOSING("reports.tab_closing", false),
}

/**
 * Financial reports (perm `report.finance`): Overview / Sales / Expenses /
 * Nasiya / Inventory / Pricing / Closing, matching the web tabs. A shared
 * date range (kit [AppDateRangeField]) drives the ranged tabs; tapping a tile
 * or bar opens a [ReportDrillSheet] drill-down.
 */
@Composable
fun ReportsScreen(container: AppContainer) {
    val t = LocalT.current
    val vm = financeViewModel(container) { FinanceReadsViewModel(it) }
    val canCost = LocalCan.current("device.cost.view")
    var tab by remember { mutableStateOf(ReportTab.OVERVIEW) }
    val default = remember { defaultReportRangeMillis() }
    var range by remember { mutableStateOf(DateRange(default.first, default.second)) }
    var drill by remember { mutableStateOf<ReportDrill?>(null) }

    val fromIso = isoDate(range.startMillis)
    val toIso = isoDate(range.endMillis)
    val bucket = bucketForRange(range.startMillis, range.endMillis)
    val openDrill: (ReportDrill) -> Unit = { drill = it }

    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            ReportTab.entries.forEach { entry ->
                PillButton(
                    t(entry.labelKey, null),
                    onClick = { tab = entry },
                    variant = if (tab == entry) ButtonVariant.DEFAULT else ButtonVariant.GHOST,
                )
            }
        }
        HorizontalDivider(color = Tokens.border)
        if (tab.ranged) {
            AppDateRangeField(
                label = t("reports.period", null),
                range = range,
                onPick = { range = it },
                modifier = Modifier.fillMaxWidth().padding(16.dp),
            )
        }
        Box(Modifier.weight(1f).fillMaxWidth()) {
            when (tab) {
                ReportTab.OVERVIEW -> OverviewTab(vm, fromIso, toIso, bucket, openDrill)
                ReportTab.SALES -> SalesTab(vm, fromIso, toIso, openDrill)
                ReportTab.EXPENSES -> ExpensesReportTab(vm, fromIso, toIso, openDrill)
                ReportTab.NASIYA -> NasiyaTab(vm, fromIso, toIso, openDrill)
                ReportTab.INVENTORY -> InventoryTab(vm, canCost, openDrill)
                ReportTab.PRICING -> ModelPricingTab(vm)
                ReportTab.CLOSING -> DailyClosingTab(vm)
            }
        }
    }

    drill?.let { current ->
        ReportDrillSheet(
            drill = current,
            onOpen = { container.featureNav.open(it) },
            onDismiss = { drill = null },
        )
    }
}
