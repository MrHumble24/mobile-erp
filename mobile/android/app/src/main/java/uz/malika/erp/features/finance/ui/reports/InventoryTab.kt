package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.app.Destination
import uz.malika.erp.features.finance.data.InventoryModelRow
import uz.malika.erp.features.finance.data.InventoryReport
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.features.finance.ui.components.BreakdownBars
import uz.malika.erp.features.finance.ui.components.BreakdownDatum
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile
import kotlin.math.roundToInt
import uz.malika.erp.ui.theme.Tokens

/** Inventory snapshot: stock tiles + status / model / aging unit breakdowns. */
@Composable
fun InventoryTab(
    vm: FinanceReadsViewModel,
    canCost: Boolean,
    onDrill: (ReportDrill) -> Unit,
) {
    val t = LocalT.current
    val handle = rememberAsync { vm.inventoryReport() }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState())
            .padding(start = Tokens.Space.screenH, end = Tokens.Space.screenH, bottom = Tokens.Space.lg),
        verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg),
    ) {
        AsyncContent(handle, retryLabel = t("common.retry", null)) { r -> Body(r, canCost, onDrill) }
    }
}

@Composable
private fun Body(r: InventoryReport, canCost: Boolean, onDrill: (ReportDrill) -> Unit) {
    val t = LocalT.current
    val daysShort = t("reports.daysShort", null)
    MetricGrid(
        tiles = buildList<@Composable (Modifier) -> Unit> {
            add { m -> MetricTile(t("dashboard.unitsInStock", null), r.inStockUnits.toString(), m, money = false) }
            if (canCost) {
                add { m -> MetricTile(t("reports.landedValue", null), r.inStockLandedValue, m) }
            }
            add { m -> MetricTile(t("reports.defective", null), r.defectiveUnits.toString(), m, money = false) }
            add { m -> MetricTile(t("reports.consigned", null), r.consignedUnits.toString(), m, money = false) }
        },
    )
    val unitLabel = { v: Double -> v.roundToInt().toString() }
    BreakdownBars(
        title = t("reports.byStatus", null),
        rows = shareByValue(r.byStatus.map { BreakdownDatum(it.statusCode, it.label, it.count.toDouble(), 0.0) }),
        formatValue = unitLabel,
    )
    BreakdownBars(
        title = t("reports.byModel", null),
        rows = shareByValue(r.byModel.map { BreakdownDatum(it.modelId, "${it.label} · ${it.avgDaysInStock.roundToInt()}$daysShort", it.units.toDouble(), 0.0) }),
        formatValue = unitLabel,
        onSelect = { datum ->
            r.byModel.firstOrNull { it.modelId == datum.key }?.let { onDrill(modelDrill(it, canCost, t)) }
        },
    )
    BreakdownBars(
        title = t("reports.aging", null),
        rows = shareByValue(r.aging.map { BreakdownDatum(it.bucket, it.bucket, it.units.toDouble(), 0.0) }),
        formatValue = unitLabel,
    )
}

/** Recompute each row's share from its value (server omits share for unit series). */
private fun shareByValue(rows: List<BreakdownDatum>): List<BreakdownDatum> {
    val total = rows.sumOf { it.value }.coerceAtLeast(1.0)
    return rows.map { it.copy(share = it.value / total) }
}

private fun modelDrill(row: InventoryModelRow, canCost: Boolean, t: (String, Map<String, Any?>?) -> String) =
    ReportDrill(
        title = row.label,
        lines = buildList {
            add(DrillLine(t("reports.units", null), row.units.toString()))
            if (canCost) add(DrillLine(t("reports.landedValue", null), formatMoney(row.landedValue)))
            add(DrillLine(t("reports.aging", null), "${row.avgDaysInStock.roundToInt()} ${t("reports.daysShort", null)}"))
        },
        destination = Destination.Inventory(),
        actionLabel = t("nav.inventory", null),
    )
