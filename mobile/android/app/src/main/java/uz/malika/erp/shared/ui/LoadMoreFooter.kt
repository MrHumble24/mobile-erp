package uz.malika.erp.shared.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.ui.theme.Tokens

/**
 * Footer for a paginated list: a "load more" button while [hasMore], a spinner
 * while [loading], nothing when the list is complete. Drop into a trailing
 * `item { LoadMoreFooter(...) }` of a `LazyColumn`, driven by a `PageState`
 * (`hasMore = state.hasMore`, `loading = state.loading`).
 */
@Composable
fun LoadMoreFooter(
    hasMore: Boolean,
    loading: Boolean,
    onLoadMore: () -> Unit,
    modifier: Modifier = Modifier,
) {
    if (!hasMore && !loading) return
    val t = LocalT.current
    Box(
        modifier.fillMaxWidth().padding(16.dp),
        contentAlignment = Alignment.Center,
    ) {
        if (loading) {
            CircularProgressIndicator(strokeWidth = 2.dp, color = Tokens.text)
        } else {
            PillButton(
                text = t("common.loadMore", null),
                onClick = onLoadMore,
                variant = ButtonVariant.OUTLINE,
            )
        }
    }
}
