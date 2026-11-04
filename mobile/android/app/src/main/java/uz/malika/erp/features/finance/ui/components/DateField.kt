package uz.malika.erp.features.finance.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarToday
import androidx.compose.material3.DatePicker
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.finance.model.displayDate
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.warmDatePickerColors
import uz.malika.erp.ui.theme.Tokens
import java.util.Date

/**
 * A tappable date field (label + value) that opens a Caldera bottom sheet with
 * the Material3 date picker. Built in-slice because the kit ships no date field.
 */
@Composable
fun DateField(
    label: String,
    value: Date?,
    onChanged: (Date) -> Unit,
    modifier: Modifier = Modifier,
) {
    var open by remember { mutableStateOf(false) }
    Column(modifier.width(170.dp)) {
        Text(label, style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        Spacer(Modifier.height(6.dp))
        Row(
            Modifier
                .fillMaxWidth()
                .border(BorderStroke(1.dp, Tokens.border), RoundedCornerShape(Tokens.Radius.inputs))
                .clickable { open = true }
                .padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(value?.let { displayDate(it) } ?: "—", style = MaterialTheme.typography.bodyMedium)
            Icon(Icons.Outlined.CalendarToday, contentDescription = null, tint = Tokens.muted)
        }
    }
    if (open) {
        DatePickerSheet(
            initial = value,
            onDismiss = { open = false },
            onPick = { onChanged(it); open = false },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DatePickerSheet(initial: Date?, onDismiss: () -> Unit, onPick: (Date) -> Unit) {
    val t = LocalT.current
    val pickerState = androidx.compose.material3.rememberDatePickerState(
        initialSelectedDateMillis = (initial ?: Date()).time,
    )
    AppBottomSheet(onDismiss = onDismiss) {
        DatePicker(state = pickerState, showModeToggle = false, colors = warmDatePickerColors())
        Row(
            Modifier.fillMaxWidth().padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.End),
        ) {
            PillButton(t("common.cancel", null), onClick = onDismiss, variant = ButtonVariant.OUTLINE)
            PillButton(
                t("common.confirm", null),
                onClick = { pickerState.selectedDateMillis?.let { onPick(Date(it)) } ?: onDismiss() },
            )
        }
    }
}
