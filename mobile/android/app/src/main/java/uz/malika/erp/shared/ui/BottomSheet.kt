package uz.malika.erp.shared.ui

import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import uz.malika.erp.ui.theme.Tokens

/**
 * A themed modal bottom sheet (radius-large-cards top corners) for detail panes,
 * pickers, and the camera scanner. Caller shows it conditionally and handles
 * [onDismiss].
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppBottomSheet(
    onDismiss: () -> Unit,
    content: @Composable ColumnScope.() -> Unit,
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Tokens.surfaceCanvas,
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
        content = content,
    )
}
