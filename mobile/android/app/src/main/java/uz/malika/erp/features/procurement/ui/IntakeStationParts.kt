package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.input.KeyboardType
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.AppSwitch
import uz.malika.erp.ui.theme.Tokens

/**
 * IMEI 1 heading with the Dual SIM toggle on the right. The label + switch are a
 * single `toggleable` target with `Role.Switch`, so TalkBack announces one
 * named switch (the "Dual SIM" label) instead of an unlabeled control.
 */
@Composable
fun ImeiSlotLabel(
    label: String,
    dualSim: Boolean,
    dualLabel: String,
    onDualChange: (Boolean) -> Unit,
) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1f))
        Row(
            modifier = Modifier.toggleable(value = dualSim, onValueChange = onDualChange, role = Role.Switch),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(dualLabel, style = MaterialTheme.typography.labelLarge)
            Spacer(Modifier.width(Tokens.Space.gap))
            AppSwitch(checked = dualSim, onCheckedChange = null)
        }
    }
}

/**
 * Per-phone expense + note defaults, shown only with `device.expense`. They
 * carry onto each unit staged while they are set (editable between units), so
 * the server posts a `DEVICE_EXPENSE` ledger row for the entered amount.
 */
@Composable
fun ExpenseDefaults(
    expense: String,
    onExpenseChange: (String) -> Unit,
    note: String,
    onNoteChange: (String) -> Unit,
) {
    val t = LocalT.current
    AppCard {
        Text(t("inventory.unitExpense", null), style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(Tokens.Space.section))
        AppFormField(
            t("inventory.unitExpense", null), expense, onExpenseChange,
            keyboardType = KeyboardType.Decimal,
        )
        Spacer(Modifier.height(Tokens.Space.rowV))
        Text(t("inventory.unitExpenseHint", null), style = MaterialTheme.typography.bodySmall, color = Tokens.slate)
        Spacer(Modifier.height(Tokens.Space.section))
        AppFormField(t("inventory.unitExpenseNote", null), note, onNoteChange)
    }
}

/** Captured code (mono) once a slot is filled, or its inline validation error. */
@Composable
fun SlotHint(value: String, error: String?) {
    when {
        error != null -> {
            Spacer(Modifier.height(Tokens.Space.rowV))
            Text(error, style = MaterialTheme.typography.bodySmall, color = Tokens.destructive)
        }
        value.isNotBlank() -> {
            Spacer(Modifier.height(Tokens.Space.rowV))
            ImeiText(value, style = MaterialTheme.typography.bodySmall)
        }
    }
}
