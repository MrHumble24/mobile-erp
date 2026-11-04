package uz.malika.erp.shared.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import uz.malika.erp.ui.theme.Tokens

/** One choice in a [SegmentedControl]. */
data class SegmentOption<T>(val value: T, val label: String, val icon: ImageVector? = null)

private val TrackHeight = 44.dp
private val TrackShape = RoundedCornerShape(Tokens.Radius.controls) // 12
private val SegmentShape = RoundedCornerShape(10.dp)

/**
 * A Warm Card segmented control for small, mutually-exclusive sets: a surface-2
 * track, the selected segment a white card with text-colour label, the rest
 * muted. No Material border, no selection check-mark, press feedback from the
 * theme indication. Labels are single-line and ellipsize if a segment is narrow.
 */
@Composable
fun <T> SegmentedControl(
    options: List<SegmentOption<T>>,
    selected: T,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier
            .fillMaxWidth()
            .height(TrackHeight)
            .clip(TrackShape)
            .background(Tokens.surface2)
            .padding(Tokens.Space.xs),
        horizontalArrangement = Arrangement.spacedBy(Tokens.Space.xs),
    ) {
        options.forEach { option ->
            Segment(
                option = option,
                selected = option.value == selected,
                onClick = { onSelect(option.value) },
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun <T> Segment(
    option: SegmentOption<T>,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier,
) {
    val content = if (selected) Tokens.text else Tokens.muted
    Row(
        modifier
            .fillMaxHeight()
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
