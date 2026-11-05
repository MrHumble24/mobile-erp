package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.finance.data.ProfitReport
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.model.bucketForRange
import uz.malika.erp.features.finance.model.isoRangeFrom
import uz.malika.erp.features.finance.model.isoRangeTo
import uz.malika.erp.features.finance.ui.components.financeViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.FilterButton
import uz.malika.erp.shared.ui.TabChipItem
import uz.malika.erp.shared.ui.TabChips
import uz.malika.erp.ui.theme.Tokens

private enum class ReportSection(val labelKey: String, val ranged: Boolean) {
    OVERVIEW("reports.tab_overview", true),
    EXPENSES("reports.tab_expenses", true),
    NASIYA("reports.tab_nasiya", true),
    INVENTORY("reports.tab_inventory", false),
    PRICING("reports.tab_pricing", false),
    CLOSING("reports.tab_closing", false),
    CUSTOMS("reports.customsTab", false),
}

/**
 * Financial reports (perm `report.finance`), restructured for the phone: six
 * sections on the kit chip row — P&L overview (with the sales breakdown folded
 * in) · Expenses · Nasiya · Inventory · Pricing · Closing. The period bar sits
 * under the chips on the three period sections and opens [ReportFilterSheet];
 * inventory is a live snapshot, pricing a rolling window, closing a single day.
 * Tapping a row or bar opens a [ReportDrillSheet] drill-down.
 */
@Composable
fun ReportsScreen(container: AppContainer) {
    val t = LocalT.current
    val vm = financeViewModel(container) { FinanceReadsViewModel(it) }
    val canCost = LocalCan.current("device.cost.view")
    var section by remember { mutableStateOf(ReportSection.OVERVIEW) }
    val default = remember { presetRangeMillis(DEFAULT_REPORT_PRESET) }
    var preset by remember { mutableStateOf(DEFAULT_REPORT_PRESET) }
    var range by remember { mutableStateOf(DateRange(default.first, default.second)) }
    var showFilters by remember { mutableStateOf(false) }
    var drill by remember { mutableStateOf<ReportDrill?>(null) }
    var returnsRange by remember { mutableStateOf<Pair<String?, String?>?>(null) }
    var noi by remember { mutableStateOf<ProfitReport?>(null) }

    val fromIso = isoRangeFrom(range.startMillis)
    val toIso = isoRangeTo(range.endMillis)
    val bucket = bucketForRange(range.startMillis, range.endMillis)
    val openDrill: (ReportDrill) -> Unit = { drill = it }
    val activeCount = if (preset != DEFAULT_REPORT_PRESET) 1 else 0

    Column(Modifier.fillMaxSize()) {
        Spacer(Modifier.height(Tokens.Space.md))
        TabChips(
            items = ReportSection.entries.map { TabChipItem(it, t(it.labelKey, null)) },
            selected = section,
            onSelect = { section = it },
        )
        Spacer(Modifier.height(Tokens.Space.md))
        if (section.ranged) {
            Row(
                Modifier.fillMaxWidth().padding(start = Tokens.Space.screenH, end = Tokens.Space.sm, bottom = Tokens.Space.sm),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(reportRangeLabel(preset, range), style = MaterialTheme.typography.titleSmall, color = Tokens.text, modifier = Modifier.weight(1f))
                FilterButton(activeCount = activeCount, onClick = { showFilters = true })
            }
        }
        Box(Modifier.weight(1f).fillMaxWidth()) {
            when (section) {
                ReportSection.OVERVIEW -> OverviewTab(
                    vm, fromIso, toIso, bucket, openDrill,
                    onReturns = { f, to -> returnsRange = f to to },
                    onNoi = { noi = it },
                )
                ReportSection.EXPENSES -> ExpensesReportTab(vm, fromIso, toIso, openDrill)
                ReportSection.NASIYA -> NasiyaTab(vm, fromIso, toIso, openDrill)
                ReportSection.INVENTORY -> InventoryTab(vm, canCost, openDrill)
                ReportSection.PRICING -> ModelPricingTab(vm)
                ReportSection.CLOSING -> DailyClosingTab(vm)
                ReportSection.CUSTOMS -> CustomsFeesTab(container)
            }
        }
    }

    if (showFilters && section.ranged) {
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
            canReset = activeCount > 0,
            onReset = {
                preset = DEFAULT_REPORT_PRESET
                val (s, e) = presetRangeMillis(DEFAULT_REPORT_PRESET)
                range = DateRange(s, e)
            },
            onDismiss = { showFilters = false },
        )
    }
    drill?.let { current ->
        ReportDrillSheet(drill = current, onOpen = { container.featureNav.open(it) }, onDismiss = { drill = null })
    }
    returnsRange?.let { (f, to) -> ReturnsBreakdownSheet(vm, f, to, onDismiss = { returnsRange = null }) }
    noi?.let { report -> NoiWaterfallSheet(report, onDismiss = { noi = null }) }
}
