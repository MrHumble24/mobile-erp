package uz.malika.erp.shared.ui

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import uz.malika.erp.ui.theme.Tokens

/**
 * A themed confirm/cancel dialog (radius-large-cards). Caller controls
 * visibility; [onConfirm]/[onDismiss] fire the choice. Use for destructive
 * confirmations (logout, delete).
 */
@Composable
fun AppConfirmDialog(
    title: String,
    message: String,
    confirmLabel: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    cancelLabel: String? = null,
    destructive: Boolean = false,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RoundedCornerShape(20.dp),
        containerColor = Tokens.surfaceCanvas,
        title = { Text(title) },
        text = { Text(message) },
        confirmButton = {
            PillButton(
                text = confirmLabel,
                onClick = onConfirm,
                variant = if (destructive) ButtonVariant.DESTRUCTIVE else ButtonVariant.DEFAULT,
            )
        },
        dismissButton = cancelLabel?.let { { TextButton(onClick = onDismiss) { Text(it) } } },
    )
}
