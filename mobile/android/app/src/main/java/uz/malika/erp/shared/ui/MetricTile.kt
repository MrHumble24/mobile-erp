package uz.malika.erp.shared.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * A labelled figure card (revenue, profit, counts, …). Promoted from the
 * finance/nasiya/admin slices (DRY). [emphasis] tints the value (danger for
 * expenses/refunds/overdue, success for net income). When [money] the value is
 * formatted and rendered in the mono face so amounts align; pass `money = false`
 * for counts or pre-formatted strings.
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
    AppCard(modifier) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = Tokens.mutedForeground)
        Spacer(Modifier.height(6.dp))
        val style = MaterialTheme.typography.titleLarge.let {
            if (money) it.copy(fontFamily = MonoFamily) else it
        }
        Text(
            if (money) formatMoney(value) else value,
            style = style,
            color = emphasis ?: Tokens.foreground,
        )
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

/**
 * Lays metric tiles out in a responsive wrap, [perRow] equal-width cells per
 * row. Each entry receives the `Modifier.weight` to apply to its card.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun MetricGrid(
    tiles: List<@Composable (Modifier) -> Unit>,
    modifier: Modifier = Modifier,
    perRow: Int = 2,
) {
    FlowRow(
        modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        maxItemsInEachRow = perRow,
    ) {
        tiles.forEach { tile -> tile(Modifier.weight(1f)) }
    }
}
