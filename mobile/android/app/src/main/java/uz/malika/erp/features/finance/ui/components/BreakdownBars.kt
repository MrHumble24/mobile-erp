package uz.malika.erp.features.finance.ui.components

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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens
import kotlin.math.abs

/**
 * Ranked horizontal breakdown inside an [AppCard] (DESIGN.md: the magnitude
 * is a text-colour bar on the border track, never a hue). Rows past [limit]
 * fold into an "others" row; non-"others" rows are tappable when [onSelect]
 * is set (breakdown drill-down).
 */
@Composable
fun BreakdownBars(
    title: String,
    rows: List<BreakdownDatum>,
    formatValue: (Double) -> String,
    modifier: Modifier = Modifier,
    limit: Int = 10,
    onSelect: ((BreakdownDatum) -> Unit)? = null,
    /** Off for magnitudes that are not shares of a whole (e.g. average prices). */
    showShare: Boolean = true,
) {
    val t = LocalT.current
    AppCard(modifier.fillMaxWidth()) {
        Text(title, style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.md))
        if (rows.isEmpty()) {
            Text(t("reports.empty", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
        } else {
            BreakdownRows(rows, formatValue, limit, onSelect, showShare)
        }
    }
}

/** The bar rows alone, for a sheet or a composite card (never a nested card). */
@Composable
fun BreakdownRows(
    rows: List<BreakdownDatum>,
    formatValue: (Double) -> String,
    limit: Int = 10,
    onSelect: ((BreakdownDatum) -> Unit)? = null,
    showShare: Boolean = true,
) {
    val t = LocalT.current
    val capped = capWithOther(rows, limit, t("reports.other", null))
    val max = capped.maxOf { abs(it.value) }.coerceAtLeast(1.0)
    Column(verticalArrangement = Arrangement.spacedBy(Tokens.Space.md)) {
        capped.forEach { row -> BreakdownRowView(row, max, formatValue, onSelect, showShare) }
    }
}

@Composable
private fun BreakdownRowView(
    row: BreakdownDatum,
    max: Double,
    formatValue: (Double) -> String,
    onSelect: ((BreakdownDatum) -> Unit)?,
    showShare: Boolean,
) {
    val clickable = onSelect != null && row.key != OTHER_KEY
    val base = Modifier.fillMaxWidth()
    Column(if (clickable) base.clickable { onSelect!!(row) } else base) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(
                row.label,
                style = MaterialTheme.typography.bodyMedium,
                color = Tokens.text,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f).padding(end = Tokens.Space.sm),
            )
            Text(
                if (showShare) "${formatValue(row.value)} · ${"%.1f".format(row.share * 100)}%" else formatValue(row.value),
                style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily),
                color = Tokens.muted,
            )
        }
        Spacer(Modifier.height(Tokens.Space.xs))
        Box(
            Modifier.fillMaxWidth().height(6.dp).background(Tokens.border, RoundedCornerShape(Tokens.Radius.pill)),
            contentAlignment = Alignment.CenterStart,
        ) {
            Box(
                Modifier
                    .fillMaxWidth((abs(row.value) / max).coerceIn(0.0, 1.0).toFloat())
                    .height(6.dp)
                    .background(if (row.key == OTHER_KEY) Tokens.muted else if (row.value < 0) Tokens.danger else Tokens.text, RoundedCornerShape(Tokens.Radius.pill)),
            )
        }
    }
}
