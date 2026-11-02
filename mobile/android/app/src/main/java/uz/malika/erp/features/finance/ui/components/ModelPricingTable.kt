package uz.malika.erp.features.finance.ui.components

import androidx.compose.runtime.Composable
import uz.malika.erp.features.finance.data.ModelPricingRow
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppDataTable

/**
 * Model pricing & margins table, shared by the dashboard card and the reports
 * tab. The acquisition-cost column appears only when [canCost]
 * (`device.cost.view`); a null cost renders as "—".
 */
@Composable
fun ModelPricingTable(
    rows: List<ModelPricingRow>,
    labels: Map<String, String>,
    canCost: Boolean,
) {
    val t = LocalT.current
    val columns = buildList {
        add(t("inventory.model", null)); add(t("inventory.storage", null))
        if (canCost) add(t("dashboard.avgAcquisitionCost", null))
        add(t("dashboard.avgSellingPrice", null))
        add(t("dashboard.unitsInStock", null)); add(t("dashboard.unitsSold", null))
    }
    val widths = if (canCost) listOf(150, 90, 130, 130, 90, 80) else listOf(150, 90, 130, 90, 80)
    AppDataTable(
        columns = columns,
        rows = rows,
        columnWidths = widths,
        cell = { r, c -> cellOf(r, c, canCost, labels[r.modelId] ?: r.modelId) },
    )
}

private fun money(value: String?): String = if (value == null) "—" else formatMoney(value)

private fun cellOf(r: ModelPricingRow, c: Int, canCost: Boolean, name: String): String {
    val cols = buildList {
        add(name); add(r.storage ?: "—")
        if (canCost) add(money(r.avgAcquisitionCost))
        add(money(r.avgSellingPrice)); add(r.unitsInStock.toString()); add(r.unitsSold.toString())
    }
    return cols.getOrElse(c) { "" }
}
