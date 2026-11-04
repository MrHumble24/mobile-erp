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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.model.bucketForRange
import uz.malika.erp.features.finance.model.isoRangeFrom
import uz.malika.erp.features.finance.model.isoRangeTo
import uz.malika.erp.features.finance.ui.components.SelectOption
import uz.malika.erp.features.finance.ui.components.financeViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.FilterButton
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
 * Nasiya / Inventory / Pricing / Closing, matching the web tabs. The date range
 * (presets + custom) and each tab's group-by live in one [ReportFilterSheet]
 * opened from the top-right filter button; the active range shows as a compact
 * label beside it. Tapping a tile or bar opens a [ReportDrillSheet] drill-down.
 */
@Composable
fun ReportsScreen(container: AppContainer) {
    val t = LocalT.current
    val vm = financeViewModel(container) { FinanceReadsViewModel(it) }
    val canCost = LocalCan.current("device.cost.view")
    var tab by remember { mutableStateOf(ReportTab.OVERVIEW) }
    val default = remember { presetRangeMillis(DEFAULT_REPORT_PRESET) }
    var preset by remember { mutableStateOf(DEFAULT_REPORT_PRESET) }
    var range by remember { mutableStateOf(DateRange(default.first, default.second)) }
    var salesGroupBy by remember { mutableStateOf("model") }
    var expensesGroupBy by remember { mutableStateOf("category") }
    var showFilters by remember { mutableStateOf(false) }
    var drill by remember { mutableStateOf<ReportDrill?>(null) }
    var returnsRange by remember { mutableStateOf<Pair<String?, String?>?>(null) }
    var noi by remember { mutableStateOf<uz.malika.erp.features.finance.data.ProfitReport?>(null) }

    val fromIso = isoRangeFrom(range.startMillis)
    val toIso = isoRangeTo(range.endMillis)
    val bucket = bucketForRange(range.startMillis, range.endMillis)
    val openDrill: (ReportDrill) -> Unit = { drill = it }

    val groupSpec = when (tab) {
        ReportTab.SALES -> GroupBySpec(
            options = listOf("model", "channel", "cashier", "day").map { SelectOption(it, t("reports.group_$it", null)) },
            selected = salesGroupBy,
            onSelect = { salesGroupBy = it },
        )
        ReportTab.EXPENSES -> GroupBySpec(
            options = listOf(
                SelectOption("category", t("reports.groupByCategory", null)),
                SelectOption("month", t("reports.groupByMonth", null)),
            ),
            selected = expensesGroupBy,
            onSelect = { expensesGroupBy = it },
        )
        else -> null
    }
    val activeCount = (if (preset != DEFAULT_REPORT_PRESET) 1 else 0) +
        (if (groupSpec != null && groupSpec.selected != groupSpec.options.first().value) 1 else 0)

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
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    reportRangeLabel(preset, range),
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.weight(1f),
                )
                FilterButton(activeCount = activeCount, onClick = { showFilters = true })
            }
        }
        Box(Modifier.weight(1f).fillMaxWidth()) {
            when (tab) {
                ReportTab.OVERVIEW -> OverviewTab(
                    vm, fromIso, toIso, bucket, openDrill,
                    onReturns = { f, to -> returnsRange = f to to },
                    onNoi = { noi = it },
                )
                ReportTab.SALES -> SalesTab(vm, fromIso, toIso, salesGroupBy, openDrill)
                ReportTab.EXPENSES -> ExpensesReportTab(vm, fromIso, toIso, expensesGroupBy, openDrill)
                ReportTab.NASIYA -> NasiyaTab(vm, fromIso, toIso, openDrill)
                ReportTab.INVENTORY -> InventoryTab(vm, canCost, openDrill)
                ReportTab.PRICING -> ModelPricingTab(vm)
                ReportTab.CLOSING -> DailyClosingTab(vm)
            }
        }
    }

    if (showFilters && tab.ranged) {
        ReportFilterSheet(
            preset = preset,
            range = range,
            onPreset = { p ->
                preset = p
                if (p != ReportRangePreset.CUSTOM) {
                    val (s, e) = presetRangeMillis(p)
                    range = DateRange(s, e)
                }
            },
            onCustomRange = { range = it },
            groupBy = groupSpec,
            canReset = activeCount > 0,
            onReset = {
                preset = DEFAULT_REPORT_PRESET
                val (s, e) = presetRangeMillis(DEFAULT_REPORT_PRESET)
                range = DateRange(s, e)
                salesGroupBy = "model"
                expensesGroupBy = "category"
            },
            onDismiss = { showFilters = false },
        )
    }

    drill?.let { current ->
        ReportDrillSheet(
            drill = current,
            onOpen = { container.featureNav.open(it) },
            onDismiss = { drill = null },
        )
    }
    returnsRange?.let { (f, to) ->
        ReturnsBreakdownSheet(vm, f, to, onDismiss = { returnsRange = null })
    }
    noi?.let { report ->
        NoiWaterfallSheet(report, onDismiss = { noi = null })
    }
}
