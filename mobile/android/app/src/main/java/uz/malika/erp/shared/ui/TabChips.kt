package uz.malika.erp.shared.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** One chip: its value, label, optional mono count and the hue it takes when selected. */
data class TabChipItem<T>(val value: T, val label: String, val count: Int? = null, val hue: Color? = null)

/**
 * Tabs as a scrolling chip row (DESIGN.md): where a fixed [SegmentedControl]
 * would truncate three or more labels. Selected = hue pill pair (text hue by
 * default); counts render in mono.
 */
@Composable
fun <T> TabChips(
    items: List<TabChipItem<T>>,
    selected: T,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(horizontal = Tokens.Space.screenH),
) {
    LazyRow(
        modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm),
        contentPadding = contentPadding,
    ) {
        items(items) { item ->
            TabChip(item.label, item.count, item.hue ?: Tokens.text, item.value == selected) { onSelect(item.value) }
        }
    }
}

@Composable
private fun TabChip(label: String, count: Int?, hue: Color, selected: Boolean, onTap: () -> Unit) {
    Row(
        Modifier
            .clip(RoundedCornerShape(Tokens.Radius.pill))
            .background(if (selected) hue.copy(alpha = 0.14f) else Tokens.card)
            .clickable(onClick = onTap)
            .height(40.dp)
            .padding(horizontal = Tokens.Space.lg),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm),
    ) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = if (selected) hue else Tokens.muted, maxLines = 1)
        count?.let {
            Text(it.toString(), style = MaterialTheme.typography.labelMedium.copy(fontFamily = MonoFamily), color = if (selected) hue else Tokens.text)
        }
    }
}
