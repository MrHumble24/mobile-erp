package uz.malika.erp.features.finance.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.finance.data.TrendPoint
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.ui.theme.Tokens

/** One named money series extracted from the trend points. */
private data class Series(val label: String, val color: Color, val values: List<Double>)

/**
 * Multi-series trend line chart (revenue / gross profit / expenses) drawn with
 * Compose [Canvas] — the analogue of the web `TrendChart` area chart. All
 * series share one y-scale so magnitudes stay comparable.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TrendLineChart(title: String, points: List<TrendPoint>, modifier: Modifier = Modifier) {
    val t = LocalT.current
    AppCard(modifier.fillMaxWidth()) {
        Text(title, style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(12.dp))
        if (points.size < 2) {
            EmptyView(t("reports.empty", null))
            return@AppCard
        }
        val series = listOf(
            Series(t("dashboard.revenue", null), Tokens.chart[0], points.map { parseMoney(it.revenue).toDouble() }),
            Series(t("dashboard.grossProfit", null), Tokens.chart[2], points.map { parseMoney(it.grossProfit).toDouble() }),
            Series(t("dashboard.expenses", null), Tokens.chart[1], points.map { parseMoney(it.expenses).toDouble() }),
        )
        val max = series.flatMap { it.values }.maxOrNull()?.coerceAtLeast(1.0) ?: 1.0

        Canvas(Modifier.fillMaxWidth().height(200.dp)) {
            val pad = 8.dp.toPx()
            val w = size.width - pad * 2
            val h = size.height - pad * 2
            val step = if (points.size > 1) w / (points.size - 1) else w
            series.forEach { s ->
                val path = Path()
                s.values.forEachIndexed { i, v ->
                    val x = pad + step * i
                    val y = pad + (h - (v / max * h).toFloat())
                    if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
                }
                drawPath(path, color = s.color, style = androidx.compose.ui.graphics.drawscope.Stroke(width = 3f))
            }
        }
        Spacer(Modifier.height(12.dp))
        FlowRow(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            series.forEach { s -> LegendDot(s.color, s.label) }
        }
    }
}

@Composable
private fun LegendDot(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(10.dp).background(color, CircleShape))
        Spacer(Modifier.size(6.dp))
        Text(label, style = MaterialTheme.typography.bodySmall, color = Tokens.slate)
    }
}
