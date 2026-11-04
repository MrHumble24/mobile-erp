package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarToday
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.procurement.lib.dateToMillis
import uz.malika.erp.features.procurement.lib.millisToDate
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.DatePickerDialogShape
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.warmDatePickerColors
import uz.malika.erp.ui.theme.Tokens

/**
 * A labelled date field: a bordered, Tokens-styled row (radius-9, bone border)
 * that opens the native Material date picker. Value is a `yyyy-MM-dd` string.
 * Built here because the foundation kit ships no date field; promotable to
 * shared/ui.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppDateField(label: String, value: String, onPick: (String) -> Unit, modifier: Modifier = Modifier) {
    val t = LocalT.current
    var open by remember { mutableStateOf(false) }
    val shape = RoundedCornerShape(Tokens.Radius.inputs)
    Column(modifier) {
        Text(label, style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        Spacer(Modifier.height(6.dp))
        Surface(
            shape = shape,
            color = Tokens.card,
            modifier = Modifier.fillMaxWidth().border(BorderStroke(1.dp, Tokens.border), shape).clickable { open = true },
        ) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(value, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
                Icon(Icons.Outlined.CalendarToday, contentDescription = null, tint = Tokens.muted)
            }
        }
    }

    if (open) {
        val state = rememberDatePickerState(initialSelectedDateMillis = dateToMillis(value))
        val colors = warmDatePickerColors()
        DatePickerDialog(
            onDismissRequest = { open = false },
            shape = DatePickerDialogShape,
            colors = colors,
            confirmButton = {
                PillButton(
                    text = t("common.save", null),
                    onClick = {
                        state.selectedDateMillis?.let { onPick(millisToDate(it)) }
                        open = false
                    },
                )
            },
            dismissButton = {
                PillButton(t("common.cancel", null), { open = false }, variant = ButtonVariant.GHOST)
            },
        ) {
            DatePicker(state = state, colors = colors)
        }
    }
}
