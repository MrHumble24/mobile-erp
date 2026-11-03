package uz.malika.erp.shared.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** True while a tile renders inside a [MetricGrid]'s compact list-card, so it
 *  draws a bare row (the grid owns the card chrome and the dividers). */
private val LocalMetricRowInCard = compositionLocalOf { false }

/**
 * A labelled figure tile (revenue, profit, counts, …). Promoted from the
 * finance/nasiya/admin slices (DRY). [emphasis] tints the value (danger for
 * expenses/refunds/overdue, success for net income). When [money] the value is
 * formatted and rendered in the mono face so amounts align; pass `money = false`
 * for counts or pre-formatted strings.
 *
 * On wide windows it is a tall stacked card. On compact width ([isCompactWidth])
 * it becomes a slim ~44 dp horizontal row — label (+ subtext) left, value
 * right-aligned — and a `MetricGrid` stacks those rows inside one list-card.
 */
@Composable
fun MetricTile(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    subtext: String? = null,
    emphasis: Color? = null,
    money: Boolean = true,
) {
    val display = if (money) formatMoney(value) else value
    when {
        !isCompactWidth() -> StackedMetricTile(label, display, modifier, subtext, emphasis, money)
        LocalMetricRowInCard.current -> CompactMetricRow(label, display, modifier, subtext, emphasis, money)
        else -> AppCard(modifier, padding = PaddingValues(0.dp)) {
            CompactMetricRow(label, display, Modifier, subtext, emphasis, money)
        }
    }
}

@Composable
private fun StackedMetricTile(
    label: String,
    display: String,
    modifier: Modifier,
    subtext: String?,
    emphasis: Color?,
    money: Boolean,
) {
    AppCard(modifier) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = Tokens.mutedForeground)
        Spacer(Modifier.height(6.dp))
        val style = MaterialTheme.typography.titleLarge.let {
            if (money) it.copy(fontFamily = MonoFamily) else it
        }
        Text(display, style = style, color = emphasis ?: Tokens.foreground)
        // Reserve the subtitle line even when empty so tiles in a grid row stay
        // equal height whether or not they carry a subtext.
        Spacer(Modifier.height(4.dp))
        Text(
            subtext.orEmpty(),
            style = MaterialTheme.typography.bodySmall,
            color = Tokens.mutedForeground,
            minLines = 1,
            maxLines = 1,
        )
    }
}

@Composable
private fun CompactMetricRow(
    label: String,
    display: String,
    modifier: Modifier,
    subtext: String?,
    emphasis: Color?,
    money: Boolean,
) {
    Row(
        modifier
            .fillMaxWidth()
            .heightIn(min = 44.dp)
            .padding(horizontal = Tokens.Space.cardInner, vertical = Tokens.Space.rowV),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(label, style = MaterialTheme.typography.labelMedium, color = Tokens.mutedForeground)
            if (!subtext.isNullOrEmpty()) {
                Text(subtext, style = MaterialTheme.typography.bodySmall, color = Tokens.mutedForeground)
            }
        }
        Spacer(Modifier.width(Tokens.Space.gap))
        val style = MaterialTheme.typography.titleMedium.let {
            if (money) it.copy(fontFamily = MonoFamily) else it
        }
        Text(display, style = style, color = emphasis ?: Tokens.foreground, textAlign = TextAlign.End)
    }
}

/**
 * On wide windows, [perRow] equal-width tile cards per row. On compact width,
 * one list-card (`Tokens.surfaceCanvas`, hairline border, radius 12) whose tiles
 * are slim rows split by 1 dp hairline dividers — the One UI "list card" look,
 * so a 4-KPI block is one tidy card, not four tall ones. Each entry receives the
 * `Modifier.weight` to apply to its wide card.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun MetricGrid(
    tiles: List<@Composable (Modifier) -> Unit>,
    modifier: Modifier = Modifier,
    perRow: Int = 2,
) {
    if (isCompactWidth()) {
        AppCard(modifier.fillMaxWidth(), padding = PaddingValues(0.dp)) {
            CompositionLocalProvider(LocalMetricRowInCard provides true) {
                tiles.forEachIndexed { i, tile ->
                    tile(Modifier)
                    if (i < tiles.lastIndex) HorizontalDivider(color = Tokens.hairline)
                }
            }
        }
        return
    }
    FlowRow(
        modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        maxItemsInEachRow = perRow,
    ) {
        tiles.forEach { tile -> tile(Modifier.weight(1f)) }
    }
}
