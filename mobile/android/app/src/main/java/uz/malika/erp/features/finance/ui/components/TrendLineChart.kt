package uz.malika.erp.features.finance.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import uz.malika.erp.features.finance.data.TrendPoint
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** One named money series extracted from the trend points. */
private data class Series(val label: String, val color: Color, val values: List<Double>)

/**
 * Revenue / gross profit / expenses over the period, drawn with Compose
 * [Canvas]: three hairline gridlines with mono magnitude labels, a zero
 * baseline, first/last bucket labels, and the kit hues — revenue in the text
 * colour, gross profit success, expenses danger. All series share one y-scale.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TrendLineChart(title: String, points: List<TrendPoint>, modifier: Modifier = Modifier) {
    val t = LocalT.current
    AppCard(modifier.fillMaxWidth()) {
        Text(title, style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.md))
        if (points.size < 2) {
            Text(t("reports.empty", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
            return@AppCard
        }
        val series = listOf(
            Series(t("dashboard.revenue", null), Tokens.text, points.map { parseMoney(it.revenue).toDouble() }),
            Series(t("dashboard.grossProfit", null), Tokens.success, points.map { parseMoney(it.grossProfit).toDouble() }),
            Series(t("dashboard.expenses", null), Tokens.danger, points.map { parseMoney(it.expenses).toDouble() }),
        )
        val all = series.flatMap { it.values }
        val maxV = (all.maxOrNull() ?: 0.0).coerceAtLeast(1.0)
        val minV = minOf(0.0, all.minOrNull() ?: 0.0)
        val span = (maxV - minV).coerceAtLeast(1.0)
        val grid = Tokens.border
        val muted = Tokens.muted
        val measurer = rememberTextMeasurer()
        val labelStyle = TextStyle(fontSize = 10.sp, fontFamily = MonoFamily, color = muted)
        val first = points.first().bucket.take(10)
        val last = points.last().bucket.take(10)
        Canvas(Modifier.fillMaxWidth().height(200.dp)) {
            val left = 44.dp.toPx()
            val top = 6.dp.toPx()
            val bottom = 18.dp.toPx()
            val w = size.width - left
            val h = size.height - top - bottom
            fun yOf(v: Double) = top + ((maxV - v) / span * h).toFloat()
            // Three gridlines (max / mid / min-or-zero) with mono labels at the left.
            listOf(maxV, (maxV + minV) / 2, minV).forEach { v ->
                val y = yOf(v)
                drawLine(grid, Offset(left, y), Offset(size.width, y), strokeWidth = 1f)
                val lab = measurer.measure(AnnotatedString((if (v < 0) "−" else "") + shortNumber(v)), labelStyle)
                drawText(lab, topLeft = Offset(left - lab.size.width - 6.dp.toPx(), y - lab.size.height / 2f))
            }
            if (minV < 0) drawLine(muted, Offset(left, yOf(0.0)), Offset(size.width, yOf(0.0)), strokeWidth = 1f)
            val step = w / (points.size - 1)
            series.forEach { s ->
                val path = Path()
                s.values.forEachIndexed { i, v ->
                    val x = left + step * i
                    val y = yOf(v)
                    if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
                }
                drawPath(path, color = s.color, style = Stroke(width = 2.dp.toPx()))
            }
            val l1 = measurer.measure(AnnotatedString(first), labelStyle)
            val l2 = measurer.measure(AnnotatedString(last), labelStyle)
            drawText(l1, topLeft = Offset(left, size.height - l1.size.height))
            drawText(l2, topLeft = Offset(size.width - l2.size.width, size.height - l2.size.height))
        }
        Spacer(Modifier.height(Tokens.Space.md))
        FlowRow(horizontalArrangement = Arrangement.spacedBy(Tokens.Space.lg), verticalArrangement = Arrangement.spacedBy(Tokens.Space.xs)) {
            series.forEach { s -> LegendDot(s.color, s.label) }
        }
    }
}

@Composable
private fun LegendDot(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(8.dp).background(color, CircleShape))
        Spacer(Modifier.size(6.dp))
        Text(label, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
    }
}
