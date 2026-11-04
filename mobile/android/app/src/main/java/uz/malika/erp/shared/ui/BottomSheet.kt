package uz.malika.erp.shared.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.ui.theme.Tokens

/**
 * A Warm Card modal bottom sheet: a white card that rises from the ground with
 * no drag handle, 20 dp top corners, zero tonal elevation and a 40%-of-text
 * scrim (DESIGN.md). Caller shows it conditionally and handles [onDismiss].
 *
 * Safe-area insets are handled here once for every call site: the content column
 * keeps clear of the gesture / navigation bar and lifts above the keyboard when a
 * field is focused. `navigationBarsPadding().imePadding()` consume each other, so
 * the bottom padding is max(nav bar, keyboard), never the sum. Sheets whose body
 * can exceed the screen add their own `verticalScroll` inside [content].
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppBottomSheet(
    onDismiss: () -> Unit,
    content: @Composable ColumnScope.() -> Unit,
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Tokens.card,
        scrimColor = Tokens.text.copy(alpha = 0.4f),
        tonalElevation = 0.dp,
        dragHandle = null,
        shape = RoundedCornerShape(topStart = Tokens.Radius.large, topEnd = Tokens.Radius.large),
    ) {
        Column(
            modifier = Modifier.navigationBarsPadding().imePadding(),
            content = content,
        )
    }
}
