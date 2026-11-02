package uz.malika.erp.shared.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/** Numbers the camera read but couldn't classify; tapping one submits it as the scan. */
@Composable
fun ScannedNumbers(numbers: List<String>, onPick: (String) -> Unit, modifier: Modifier = Modifier) {
    if (numbers.isEmpty()) return
    LazyRow(
        modifier = modifier,
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(numbers, key = { it }) { number ->
            PillButton(text = number, onClick = { onPick(number) }, variant = ButtonVariant.OUTLINE)
        }
    }
}
