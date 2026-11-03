package uz.malika.erp.shared.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import uz.malika.erp.ui.theme.Tokens

/**
 * Inline search field (fills the width) beside a [FilterButton] carrying the
 * active-filter count. Designed for a screen with a 16dp gutter — it adds no
 * horizontal padding of its own, so it aligns with the surrounding content.
 */
@Composable
fun SearchFilterRow(
    query: String,
    onQueryChange: (String) -> Unit,
    placeholder: String,
    activeCount: Int,
    onOpenFilters: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.weight(1f)) {
            AppTextField(
                value = query,
                onValueChange = onQueryChange,
                placeholder = placeholder,
                imeAction = ImeAction.Search,
            )
        }
        Spacer(Modifier.width(Tokens.Space.gap))
        FilterButton(activeCount = activeCount, onClick = onOpenFilters)
    }
}
