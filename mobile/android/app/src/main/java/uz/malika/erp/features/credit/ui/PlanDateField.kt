package uz.malika.erp.features.credit.ui

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
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.DatePickerDialogShape
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.warmDatePickerColors
import uz.malika.erp.ui.theme.Tokens
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

/** `yyyy-MM-dd` → epoch millis at 00:00 UTC, or null. */
private fun isoToMillis(value: String): Long? =
    runCatching { LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli() }.getOrNull()

/** Epoch millis → `yyyy-MM-dd` in UTC. */
private fun millisToIso(millis: Long): String =
    Instant.ofEpochMilli(millis).atZone(ZoneOffset.UTC).toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE)

/**
 * A Caldera single-date field for a credit due date (slice-local, like nasiya's
 * due-date picker). [value] is `yyyy-MM-dd`; [onPick] returns the same.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlanDateField(label: String, value: String, onPick: (String) -> Unit, modifier: Modifier = Modifier) {
    val t = LocalT.current
    var open by remember { mutableStateOf(false) }
    val shape = RoundedCornerShape(Tokens.radiusInputs)

    Column(modifier) {
        if (label.isNotEmpty()) {
            Text(label, style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
            Spacer(Modifier.height(6.dp))
        }
        Surface(
            shape = shape,
            color = Tokens.card,
            modifier = Modifier.fillMaxWidth().border(BorderStroke(1.dp, Tokens.border), shape).clickable { open = true },
        ) {
            Row(Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 14.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(value.ifBlank { t("common.select", null) }, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                Icon(Icons.Outlined.DateRange, contentDescription = null, tint = Tokens.muted)
            }
        }
    }

    if (open) {
        val state = rememberDatePickerState(initialSelectedDateMillis = isoToMillis(value))
        val colors = warmDatePickerColors()
        DatePickerDialog(
            onDismissRequest = { open = false },
            shape = DatePickerDialogShape,
            colors = colors,
            confirmButton = {
                PillButton(t("common.save", null), onClick = { state.selectedDateMillis?.let { onPick(millisToIso(it)) }; open = false })
            },
            dismissButton = { PillButton(t("common.cancel", null), { open = false }, variant = ButtonVariant.GHOST) },
        ) {
            DatePicker(state = state, colors = colors)
        }
    }
}
