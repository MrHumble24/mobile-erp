package uz.malika.erp.shared.ui

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
import androidx.compose.material.icons.outlined.DateRange
import androidx.compose.material3.DateRangePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberDateRangePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import java.text.SimpleDateFormat
import java.util.Locale
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.ui.theme.Tokens

/** A start/end instant pair (UTC-midnight epoch millis), either side nullable. */
data class DateRange(val startMillis: Long? = null, val endMillis: Long? = null)

private val display = SimpleDateFormat("dd.MM.yyyy", Locale.US)

private fun DateRange.label(placeholder: String): String {
    val from = startMillis?.let { display.format(it) }
    val to = endMillis?.let { display.format(it) }
    return when {
        from != null && to != null -> "$from – $to"
        from != null -> from
        else -> placeholder
    }
}

/**
 * Caldera-styled date-range field: a bordered row (matching `AppDateField`) that
 * opens the Material3 [DateRangePicker] inside the app's `MalikaTheme`, so it
 * inherits Caldera colors — no stock Material surface. Confirm/cancel are
 * [PillButton]s. Emits [DateRange] (epoch millis); the caller formats for the
 * server. Pass `null` millis to clear.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppDateRangeField(
    label: String,
    range: DateRange,
    onPick: (DateRange) -> Unit,
    modifier: Modifier = Modifier,
) {
    val t = LocalT.current
    var open by remember { mutableStateOf(false) }
    val shape = RoundedCornerShape(Tokens.radiusInputs)

    Column(modifier) {
        Text(label, style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(6.dp))
        Surface(
            shape = shape,
            color = Tokens.surfaceCanvas,
            modifier = Modifier
                .fillMaxWidth()
                .border(BorderStroke(1.dp, Tokens.border), shape)
                .clickable { open = true },
        ) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    range.label(t("common.select", null)),
                    style = MaterialTheme.typography.bodyLarge,
                    modifier = Modifier.weight(1f),
                )
                Icon(Icons.Outlined.DateRange, contentDescription = null, tint = Tokens.slate)
            }
        }
    }

    if (open) {
        val state = rememberDateRangePickerState(
            initialSelectedStartDateMillis = range.startMillis,
            initialSelectedEndDateMillis = range.endMillis,
        )
        DatePickerDialog(
            onDismissRequest = { open = false },
            confirmButton = {
                PillButton(
                    text = t("common.save", null),
                    onClick = {
                        onPick(DateRange(state.selectedStartDateMillis, state.selectedEndDateMillis))
                        open = false
                    },
                )
            },
            dismissButton = {
                PillButton(t("common.cancel", null), { open = false }, variant = ButtonVariant.GHOST)
            },
        ) {
            DateRangePicker(state = state)
        }
    }
}
