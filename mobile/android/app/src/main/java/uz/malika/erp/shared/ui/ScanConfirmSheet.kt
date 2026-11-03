package uz.malika.erp.shared.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Confirmation step between a scan and the action it triggers: the caller
 * resolves the scanned [code] and shows this sheet so a human confirms before
 * anything is added. Generic by design — only strings, an optional status
 * label/colour, and callbacks; it knows nothing about devices or carts.
 *
 * Two shapes: when [error] is null the resolved summary ([title], [price],
 * status chip) is shown with confirm (primary) + cancel (ghost); when [error]
 * is set the code and error row are shown with a single close action.
 */
@Composable
fun ScanConfirmSheet(
    code: String,
    confirmLabel: String,
    cancelLabel: String,
    closeLabel: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    title: String? = null,
    subtitle: String? = null,
    price: String? = null,
    statusLabel: String? = null,
    statusColor: Color = Tokens.slate,
    error: String? = null,
) {
    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    code,
                    modifier = Modifier.weight(1f),
                    style = MaterialTheme.typography.titleMedium.copy(fontFamily = MonoFamily),
                )
                statusLabel?.let { StatusChip(it, color = statusColor) }
            }

            subtitle?.let {
                Text(
                    it,
                    style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily),
                    color = Tokens.slate,
                )
            }

            if (error != null) {
                Text(error, style = MaterialTheme.typography.bodyMedium, color = Tokens.destructive)
                PillButton(closeLabel, onDismiss, Modifier.fillMaxWidth(), ButtonVariant.OUTLINE)
            } else {
                title?.let {
                    Text(it, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                }
                price?.let {
                    MoneyText(it, style = MaterialTheme.typography.titleMedium)
                }
                Spacer(Modifier.height(4.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    PillButton(cancelLabel, onDismiss, Modifier.weight(1f), ButtonVariant.GHOST)
                    PillButton(confirmLabel, onConfirm, Modifier.weight(1f))
                }
            }
        }
    }
}
