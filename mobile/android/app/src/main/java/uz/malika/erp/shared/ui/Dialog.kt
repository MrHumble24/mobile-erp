package uz.malika.erp.shared.ui

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import uz.malika.erp.ui.theme.Tokens

/**
 * A Warm Card confirm/cancel dialog: white card, radius 20, zero tonal
 * elevation, titleMedium heading over bodyLarge text, [PillButton]s for both
 * choices. Caller controls visibility; [onConfirm]/[onDismiss] fire the choice.
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
        shape = RoundedCornerShape(Tokens.Radius.large),
        containerColor = Tokens.card,
        tonalElevation = 0.dp,
        title = { Text(title, style = MaterialTheme.typography.titleMedium) },
        text = { Text(message, style = MaterialTheme.typography.bodyLarge) },
        confirmButton = {
            PillButton(
                text = confirmLabel,
                onClick = onConfirm,
                variant = if (destructive) ButtonVariant.DESTRUCTIVE else ButtonVariant.DEFAULT,
            )
        },
        dismissButton = cancelLabel?.let {
            { PillButton(it, onClick = onDismiss, variant = ButtonVariant.SECONDARY) }
        },
    )
}
