package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.finance.data.BreakdownRow
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** Which measure the by-model table ranks on (web `ModelMeasureBreakdown`). */
private enum class ModelMeasure { GROSS_PROFIT, UNITS }

/**
 * By-model detail table with a segmented measure toggle (gross profit ↔ units
 * sold), sorted by the active measure, each row an inline magnitude bar with
 * share — the Compose analogue of the web `ModelMeasureBreakdown`. Rows are the
 * already-fetched `profitBreakdown(groupBy="model")`; tapping one drills in.
 */
@Composable
fun ModelMeasureTable(
    rows: List<BreakdownRow>,
    onRow: (BreakdownRow) -> Unit,
    modifier: Modifier = Modifier,
) {
    val t = LocalT.current
    var measure by remember { mutableStateOf(ModelMeasure.GROSS_PROFIT) }

    fun valueOf(r: BreakdownRow): Double =
        if (measure == ModelMeasure.UNITS) r.unitsSold.toDouble() else parseMoney(r.grossProfit).toDouble()

    AppCard(modifier.fillMaxWidth()) {
        Text(t("reports.byModel", null), style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(12.dp))
        SegmentedControl(
            options = listOf(
                SegmentOption(ModelMeasure.GROSS_PROFIT, t("dashboard.grossProfit", null)),
                SegmentOption(ModelMeasure.UNITS, t("reports.units", null)),
            ),
            selected = measure,
            onSelect = { measure = it },
        )
        Spacer(Modifier.height(12.dp))
        if (rows.isEmpty()) {
            EmptyView(t("reports.empty", null))
            return@AppCard
        }
        val sorted = rows.sortedByDescending { valueOf(it) }
        val total = sorted.sumOf { valueOf(it) }.coerceAtLeast(1.0)
        val max = sorted.maxOf { valueOf(it) }.coerceAtLeast(1.0)
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            sorted.forEach { row ->
                val v = valueOf(row)
                val display = if (measure == ModelMeasure.UNITS) {
                    "${row.unitsSold} ${t("reports.units", null)}"
                } else {
                    moneyOf(v)
                }
                MeasureRow(row.label, display, share = v / total, fraction = (v / max).toFloat()) { onRow(row) }
            }
        }
    }
}

@Composable
private fun MeasureRow(
    label: String,
    value: String,
    share: Double,
    fraction: Float,
    onClick: () -> Unit,
) {
    Column(Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(
                label,
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f).padding(end = 8.dp),
            )
            Text(
                "$value · ${"%.1f".format(share * 100)}%",
                style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily),
                color = Tokens.slate,
            )
        }
        Spacer(Modifier.height(4.dp))
        Box(
            Modifier.fillMaxWidth().height(8.dp).background(Tokens.bone, RoundedCornerShape(Tokens.radiusFull)),
        ) {
            Box(
                Modifier
                    .fillMaxWidth(fraction.coerceIn(0f, 1f))
                    .height(8.dp)
                    .background(Tokens.chart[0], RoundedCornerShape(Tokens.radiusFull)),
            )
        }
    }
}
