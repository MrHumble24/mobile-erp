package uz.malika.erp.features.shifts.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/**
 * Force-close another cashier's forgotten shift (ADR 0036, `shift.manage`): the
 * counted cash and a REQUIRED note (the record of who closed it and why).
 */
@Composable
fun ForceCloseSheet(
    cashierName: String,
    submitting: Boolean,
    error: String?,
    onSubmit: (Double, String) -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    var cash by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    val value = cash.trim().toDoubleOrNull()
    val noteOk = note.trim().isNotEmpty()

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.fillMaxWidth().padding(Tokens.Space.gutter), verticalArrangement = Arrangement.spacedBy(Tokens.Space.md)) {
            Text(t("shifts.forceClose", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            Text("${cashierName} · ${t("shifts.forceCloseHint", null)}", style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            AppFormField(t("shifts.closingCash", null), cash, { cash = it }, keyboardType = KeyboardType.Decimal, enabled = !submitting)
            AppFormField(t("shifts.note", null), note, { note = it }, enabled = !submitting)
            error?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger) }
            PillButton(
                text = if (submitting) t("common.loading", null) else t("shifts.forceClose", null),
                onClick = { if (value != null && noteOk) onSubmit(value, note.trim()) },
                enabled = !submitting && value != null && value >= 0.0 && noteOk,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
