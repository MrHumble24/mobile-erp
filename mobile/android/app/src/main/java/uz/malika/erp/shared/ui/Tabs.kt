package uz.malika.erp.shared.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import uz.malika.erp.ui.theme.Tokens

/** One choice in a [SegmentedControl]. */
data class SegmentOption<T>(val value: T, val label: String, val icon: ImageVector? = null)

private val TrackHeight = 44
private val TrackShape = RoundedCornerShape(Tokens.Radius.controls) // 12
private val SegmentShape = RoundedCornerShape(10.dp)

/**
 * A Warm Card segmented control for small, mutually-exclusive sets: a surface-2
 * track, the selected segment a white card with text-colour label, the rest
 * muted. No Material border, no selection check-mark, press feedback from the
 * theme indication. Labels are single-line and ellipsize if a segment is narrow.
 *
 * The segments are laid out by hand (not Row weights) so the control works in two
 * places: with a bounded width they divide it equally (filters, the return
 * dialog); inside a `horizontalScroll` (the Developer Console tab bar) the width
 * is unbounded, so they size to the widest label and the row scrolls — a weight
 * there used to collapse every segment to one pixel.
 */
@Composable
fun <T> SegmentedControl(
    options: List<SegmentOption<T>>,
    selected: T,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
) {
    val gap = Tokens.Space.xs
    Layout(
        modifier = modifier
            .fillMaxWidth()
            .height(TrackHeight.dp)
            .clip(TrackShape)
            .background(Tokens.surface2)
            .padding(Tokens.Space.xs),
        content = {
            options.forEach { option ->
                Segment(option = option, selected = option.value == selected, onClick = { onSelect(option.value) })
            }
        },
    ) { measurables, constraints ->
        val n = measurables.size
        val h = constraints.maxHeight
        if (n == 0) return@Layout layout(0, h) {}
        val gapPx = gap.roundToPx()
        val widths: List<Int>
        val totalWidth: Int
        if (constraints.hasBoundedWidth) {
            val avail = (constraints.maxWidth - gapPx * (n - 1)).coerceAtLeast(0)
            val each = avail / n
            val extra = avail - each * n // spread the rounding remainder over the first segments
            widths = List(n) { i -> each + if (i < extra) 1 else 0 }
            totalWidth = constraints.maxWidth
        } else {
            val widest = measurables.maxOf { it.maxIntrinsicWidth(h) }
            widths = List(n) { widest }
            totalWidth = widest * n + gapPx * (n - 1)
        }
        val placeables = measurables.mapIndexed { i, m -> m.measure(Constraints.fixed(widths[i], h)) }
        layout(totalWidth, h) {
            var x = 0
            placeables.forEach { p -> p.placeRelative(x, 0); x += p.width + gapPx }
        }
    }
}

@Composable
private fun <T> Segment(
    option: SegmentOption<T>,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val content = if (selected) Tokens.text else Tokens.muted
    Row(
        Modifier
            .clip(SegmentShape)
            .background(if (selected) Tokens.card else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(horizontal = Tokens.Space.sm),
        horizontalArrangement = Arrangement.spacedBy(Tokens.Space.xs, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        option.icon?.let { Icon(it, contentDescription = null, tint = content) }
        Text(
            option.label,
            style = MaterialTheme.typography.labelLarge,
            color = content,
            maxLines = 1,
            softWrap = false,
            overflow = TextOverflow.Ellipsis,
        )
    }
}
