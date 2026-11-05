package uz.malika.erp.features.repairs.ui

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.unit.dp
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/**
 * Asks for a required note before a status move that needs one (ADR 0040):
 * cancelling a ticket, or giving it back while money is still owed.
 */
@Composable
fun StatusNoteDialog(
    title: String,
    label: String,
    busy: Boolean,
    onConfirm: (note: String) -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    var note by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = { if (!busy) onDismiss() },
        shape = RoundedCornerShape(Tokens.Radius.large),
        containerColor = Tokens.card,
        tonalElevation = 0.dp,
        title = { Text(title, style = MaterialTheme.typography.titleMedium) },
        text = { AppFormField(label = label, value = note, onValueChange = { note = it }, enabled = !busy) },
        confirmButton = { PillButton(title, { onConfirm(note.trim()) }, enabled = !busy && note.isNotBlank()) },
        dismissButton = { PillButton(t("common.cancel", null), onDismiss, variant = ButtonVariant.SECONDARY, enabled = !busy) },
    )
}
