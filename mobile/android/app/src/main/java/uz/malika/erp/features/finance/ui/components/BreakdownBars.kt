package uz.malika.erp.features.finance.ui.components

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
import androidx.compose.foundation.background
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.ui.theme.Tokens

/**
 * Horizontal ranked bar chart (label · track · value + share), the Compose
 * analogue of the web `BreakdownBarChart`. No chart library: each row is a
 * proportional [Box] track. Rows past [limit] fold into an "others" row. When
 * [onSelect] is set, non-"others" rows are tappable (breakdown drill-down).
 */
@Composable
fun BreakdownBars(
    title: String,
    rows: List<BreakdownDatum>,
    formatValue: (Double) -> String,
    modifier: Modifier = Modifier,
    limit: Int = 10,
    onSelect: ((BreakdownDatum) -> Unit)? = null,
) {
    val t = LocalT.current
    AppCard(modifier.fillMaxWidth()) {
        Text(title, style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(12.dp))
        if (rows.isEmpty()) {
            EmptyView(t("reports.empty", null))
            return@AppCard
        }
        val capped = capWithOther(rows, limit, t("reports.other", null))
        val max = capped.maxOf { it.value }.coerceAtLeast(1.0)
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            capped.forEach { row ->
                BreakdownRow(row, max, formatValue, onSelect)
            }
        }
    }
}

@Composable
private fun BreakdownRow(
    row: BreakdownDatum,
    max: Double,
    formatValue: (Double) -> String,
    onSelect: ((BreakdownDatum) -> Unit)?,
) {
    val clickable = onSelect != null && row.key != OTHER_KEY
    val base = Modifier.fillMaxWidth()
    val mod = if (clickable) base.clickable { onSelect!!(row) } else base
    Column(mod) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(
                row.label,
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f).padding(end = 8.dp),
            )
            Text(
                "${formatValue(row.value)} · ${(row.share * 100).let { "%.1f".format(it) }}%",
                style = MaterialTheme.typography.bodySmall,
                color = Tokens.slate,
            )
        }
        Spacer(Modifier.height(4.dp))
        Box(
            Modifier
                .fillMaxWidth()
                .height(8.dp)
                .background(Tokens.bone, RoundedCornerShape(Tokens.radiusFull)),
            contentAlignment = Alignment.CenterStart,
        ) {
            val fraction = (row.value / max).coerceIn(0.0, 1.0).toFloat()
            Box(
                Modifier
                    .fillMaxWidth(fraction)
                    .height(8.dp)
                    .background(
                        if (row.key == OTHER_KEY) Tokens.slate else Tokens.chart[0],
                        RoundedCornerShape(Tokens.radiusFull),
                    ),
            )
        }
    }
}
