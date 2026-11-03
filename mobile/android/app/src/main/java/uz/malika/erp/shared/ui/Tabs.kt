package uz.malika.erp.shared.ui

import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

/** One choice in a [SegmentedControl]. */
data class SegmentOption<T>(val value: T, val label: String, val icon: ImageVector? = null)

/**
 * A pill segmented control (shadcn Tabs parity) for small, mutually-exclusive
 * sets. Labels are single-line and segments share one height; when the labels
 * do not fit the available width the whole row drops one type step (labelLarge
 * → bodySmall), matching iOS `Picker(.segmented)` auto-fit, so a segment never
 * clips (ellipsis is the last resort if even the smaller step overflows).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun <T> SegmentedControl(
    options: List<SegmentOption<T>>,
    selected: T,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
) {
    val base = MaterialTheme.typography.labelLarge
    val small = MaterialTheme.typography.bodySmall
    val measurer = rememberTextMeasurer()
    val density = LocalDensity.current

    BoxWithConstraints(modifier) {
        // Segments share the width equally; a label fits if it + its chrome
        // (padding, optional icon) stays inside one equal share.
        val chromePx = with(density) { 24.dp.toPx() }
        val iconPx = with(density) { 24.dp.toPx() }
        val sharePx = with(density) { maxWidth.toPx() } / options.size
        fun fits(style: TextStyle): Boolean = options.all { opt ->
            val w = measurer.measure(opt.label, style, maxLines = 1, softWrap = false).size.width
            w + chromePx + (if (opt.icon != null) iconPx else 0f) <= sharePx
        }
        val style = if (fits(base)) base else small

        SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
            options.forEachIndexed { index, option ->
                SegmentedButton(
                    selected = option.value == selected,
                    onClick = { onSelect(option.value) },
                    shape = SegmentedButtonDefaults.itemShape(index, options.size),
                    icon = { option.icon?.let { Icon(it, contentDescription = null) } },
                    label = {
                        Text(
                            option.label,
                            style = style,
                            maxLines = 1,
                            softWrap = false,
                            overflow = TextOverflow.Ellipsis,
                        )
                    },
                )
            }
        }
    }
}
