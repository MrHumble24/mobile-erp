package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import uz.malika.erp.features.finance.data.ProfitReport
import uz.malika.erp.features.finance.ui.components.shortNumber
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** One waterfall step: a signed delta (plus the raw money string), or the total bar. */
private data class WaterfallStep(val label: String, val amount: Double, val raw: String, val isTotal: Boolean)

/**
 * Net-operating-income waterfall (web/iOS `NoiBreakdown`): revenue − COGS −
 * expenses = NOI, drawn with Compose [Canvas] (no chart library). Positive steps
 * use [Tokens.success], negative steps [Tokens.danger], the total bar
 * [Tokens.foreground]; labels in [Tokens.mutedForeground]. Data is the already
 * loaded `/reports/profit` report — no extra fetch.
 */
@Composable
fun NoiWaterfallSheet(report: ProfitReport, onDismiss: () -> Unit) {
    val t = LocalT.current
    val steps = listOf(
        WaterfallStep(t("dashboard.revenue", null), parseMoney(report.revenue).toDouble(), report.revenue, false),
        WaterfallStep(t("dashboard.cogs", null), -parseMoney(report.cogs).toDouble(), report.cogs, false),
        WaterfallStep(t("dashboard.expenses", null), -parseMoney(report.expenses).toDouble(), report.expenses, false),
        WaterfallStep(t("dashboard.netOperatingIncome", null), parseMoney(report.netOperatingIncome).toDouble(), report.netOperatingIncome, true),
    )
    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.fillMaxWidth().padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(t("reports.brkNoi", null), style = MaterialTheme.typography.headlineSmall)
            AppCard(Modifier.fillMaxWidth()) { WaterfallCanvas(steps) }
            steps.forEach { step ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    val sign = if (!step.isTotal && step.amount < 0) "− " else if (step.isTotal) "= " else ""
                    Text(sign + step.label, style = MaterialTheme.typography.bodyMedium, color = Tokens.mutedForeground)
                    MoneyText(step.raw, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }
}

@Composable
private fun WaterfallCanvas(steps: List<WaterfallStep>) {
    val measurer = rememberTextMeasurer()
    val success = Tokens.success
    val danger = Tokens.danger
    val total = Tokens.foreground
    val labelColor = Tokens.mutedForeground
    val valueStyle = TextStyle(fontSize = 10.sp, fontFamily = MonoFamily, color = labelColor)
    val labelStyle = TextStyle(fontSize = 11.sp, color = labelColor)

    // Running cumulative tops/bottoms per step (total bar anchored at zero).
    var cum = 0.0
    val bars = steps.map { step ->
        val lo: Double
        val hi: Double
        if (step.isTotal) {
            lo = minOf(0.0, step.amount); hi = maxOf(0.0, step.amount)
        } else {
            val next = cum + step.amount
            lo = minOf(cum, next); hi = maxOf(cum, next); cum = next
        }
        Triple(step, lo, hi)
    }
    val minV = minOf(0.0, bars.minOf { it.second })
    val maxV = bars.maxOf { it.third }.coerceAtLeast(1.0)
    val span = (maxV - minV).coerceAtLeast(1.0)

    Canvas(Modifier.fillMaxWidth().height(220.dp)) {
        val slot = size.width / steps.size
        val barW = (slot * 0.5f).coerceAtMost(40.dp.toPx())
        val topPad = 16.dp.toPx()
        val bottomPad = 30.dp.toPx()
        val chartH = (size.height - topPad - bottomPad).coerceAtLeast(1f)
        fun yOf(v: Double) = topPad + ((maxV - v) / span * chartH).toFloat()

        // Zero baseline.
        val zeroY = yOf(0.0)
        drawLine(labelColor, Offset(0f, zeroY), Offset(size.width, zeroY), strokeWidth = 1f)

        bars.forEachIndexed { i, (step, lo, hi) ->
            val color: Color = when {
                step.isTotal -> total
                step.amount < 0 -> danger
                else -> success
            }
            val x = slot * i + (slot - barW) / 2f
            val yTop = yOf(hi)
            val h = (yOf(lo) - yTop).coerceAtLeast(2f)
            drawRoundRect(color, Offset(x, yTop), Size(barW, h), CornerRadius(4f, 4f))

            val valLayout = measurer.measure(AnnotatedString(shortNumber(step.amount)), valueStyle)
            drawText(valLayout, topLeft = Offset(x + barW / 2f - valLayout.size.width / 2f, yTop - valLayout.size.height - 2f))

            val labLayout = measurer.measure(
                AnnotatedString(step.label),
                labelStyle,
                overflow = TextOverflow.Ellipsis,
                maxLines = 1,
                constraints = Constraints(maxWidth = slot.toInt().coerceAtLeast(1)),
            )
            drawText(labLayout, topLeft = Offset(slot * i + (slot - labLayout.size.width) / 2f, topPad + chartH + 6f))
        }
    }
}
