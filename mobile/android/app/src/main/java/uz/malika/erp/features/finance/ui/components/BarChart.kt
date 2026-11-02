package uz.malika.erp.features.finance.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens
import kotlin.math.abs

/** One labelled bar. */
data class BarDatum(val label: String, val value: Double)

/**
 * A compact bar chart drawn with Compose [Canvas] (no chart library). The
 * tallest bar sets the scale; each bar carries a short value above and its
 * label below. Caldera-styled inside an [AppCard].
 */
@Composable
fun BarChart(
    title: String,
    data: List<BarDatum>,
    modifier: Modifier = Modifier,
) {
    AppCard(modifier.fillMaxWidth()) {
        Text(title, style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(16.dp))
        if (data.isEmpty()) {
            Text("—", style = MaterialTheme.typography.bodyMedium, color = Tokens.slate)
            return@AppCard
        }
        val maxV = data.maxOf { abs(it.value) }.coerceAtLeast(1.0)
        val barColor = Tokens.chart[0]
        val measurer = rememberTextMeasurer()
        val valueStyle = TextStyle(fontSize = 10.sp, fontFamily = MonoFamily, color = Tokens.slate)
        val labelStyle = TextStyle(fontSize = 11.sp, color = Tokens.foreground)

        Canvas(Modifier.fillMaxWidth().height(220.dp)) {
            val slot = size.width / data.size
            val barW = (slot * 0.5f).coerceAtMost(28.dp.toPx())
            val topPad = 18.dp.toPx()
            val bottomPad = 34.dp.toPx()
            val chartH = (size.height - topPad - bottomPad).coerceAtLeast(1f)

            data.forEachIndexed { i, d ->
                val h = ((abs(d.value) / maxV) * chartH).toFloat()
                val x = slot * i + (slot - barW) / 2f
                val y = topPad + (chartH - h)
                drawRoundRect(
                    color = barColor,
                    topLeft = Offset(x, y),
                    size = Size(barW, h),
                    cornerRadius = CornerRadius(5f, 5f),
                )
                val valLayout = measurer.measure(AnnotatedString(shortNumber(d.value)), valueStyle)
                drawText(valLayout, topLeft = Offset(x + barW / 2f - valLayout.size.width / 2f, y - valLayout.size.height - 2f))

                val labLayout = measurer.measure(
                    AnnotatedString(d.label),
                    labelStyle,
                    overflow = TextOverflow.Ellipsis,
                    maxLines = 1,
                    constraints = Constraints(maxWidth = slot.toInt().coerceAtLeast(1)),
                )
                drawText(labLayout, topLeft = Offset(slot * i + (slot - labLayout.size.width) / 2f, topPad + chartH + 6f))
            }
        }
    }
}
