package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.layout.Column
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
import uz.malika.erp.features.finance.data.BreakdownRow
import uz.malika.erp.features.finance.ui.components.BreakdownDatum
import uz.malika.erp.features.finance.ui.components.BreakdownRows
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens
import kotlin.math.abs

/** Which measure the by-model rows rank on (web `ModelMeasureBreakdown`). */
private enum class ModelMeasure { GROSS_PROFIT, UNITS }

/**
 * By-model rows with a measure toggle (gross profit ↔ units sold), ranked by
 * the active measure as kit breakdown bars. Bare content for the sales card;
 * tapping a row drills in.
 */
@Composable
fun ModelMeasureRows(rows: List<BreakdownRow>, onRow: (BreakdownRow) -> Unit) {
    val t = LocalT.current
    var measure by remember { mutableStateOf(ModelMeasure.GROSS_PROFIT) }
    fun valueOf(r: BreakdownRow): Double =
        if (measure == ModelMeasure.UNITS) r.unitsSold.toDouble() else parseMoney(r.grossProfit).toDouble()
    Column(Modifier.fillMaxWidth()) {
        SegmentedControl(
            options = listOf(
                SegmentOption(ModelMeasure.GROSS_PROFIT, t("dashboard.grossProfit", null)),
                SegmentOption(ModelMeasure.UNITS, t("reports.units", null)),
            ),
            selected = measure,
            onSelect = { measure = it },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(Tokens.Space.md))
        if (rows.isEmpty()) {
            Text(t("reports.empty", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
            return
        }
        // Gross profit can be negative: rank and share on magnitude, show the signed value.
        val sorted = rows.sortedByDescending { abs(valueOf(it)) }
        val total = sorted.sumOf { abs(valueOf(it)) }.coerceAtLeast(1.0)
        BreakdownRows(
            rows = sorted.map { BreakdownDatum(it.key, it.label, valueOf(it), abs(valueOf(it)) / total) },
            formatValue = { v -> if (measure == ModelMeasure.UNITS) v.toInt().toString() else moneyOf(v) },
            onSelect = { datum -> rows.firstOrNull { it.key == datum.key }?.let(onRow) },
        )
    }
}
