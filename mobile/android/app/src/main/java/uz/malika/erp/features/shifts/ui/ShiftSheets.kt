package uz.malika.erp.features.shifts.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import uz.malika.erp.features.shifts.data.ShiftReportView
import uz.malika.erp.features.shifts.lib.ShiftMath
import uz.malika.erp.features.shifts.model.ShiftBarState
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** Open a shift: type the cash counted in the drawer (ADR 0036). */
@Composable
fun OpenShiftSheet(state: ShiftBarState, onOpen: (Double) -> Unit, onDismiss: () -> Unit) {
    val t = LocalT.current
    var cash by remember { mutableStateOf("") }
    val value = cash.trim().toDoubleOrNull()
    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.fillMaxWidth().padding(Tokens.Space.gutter), verticalArrangement = Arrangement.spacedBy(Tokens.Space.md)) {
            Text(t("shifts.openShift", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            AppFormField(t("shifts.openingCash", null), cash, { cash = it }, keyboardType = KeyboardType.Decimal, enabled = !state.submitting)
            state.error?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger) }
            PillButton(
                text = if (state.submitting) t("common.loading", null) else t("shifts.openShift", null),
                onClick = { value?.let(onOpen) },
                enabled = !state.submitting && value != null && value >= 0.0,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

/**
 * Close a shift: the live expected cash, the counted cash, the difference shown
 * before confirming, and an optional note. The difference is posted to the balance.
 */
@Composable
fun CloseShiftSheet(state: ShiftBarState, current: ShiftReportView?, onClose: (Double, String?) -> Unit, onDismiss: () -> Unit) {
    val t = LocalT.current
    var cash by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    val value = cash.trim().toDoubleOrNull()
    val expected = current?.expectedCash ?: "0"
    val diff = ShiftMath.difference(expected, cash)
    val mono = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily, color = Tokens.text)

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.fillMaxWidth().padding(Tokens.Space.gutter), verticalArrangement = Arrangement.spacedBy(Tokens.Space.md)) {
            Text(t("shifts.closeShift", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(t("shifts.expectedCash", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
                MoneyText(expected, style = mono)
            }
            AppFormField(t("shifts.closingCash", null), cash, { cash = it }, keyboardType = KeyboardType.Decimal, enabled = !state.submitting)
            if (cash.isNotBlank()) {
                val color = when (ShiftMath.sign(diff)) {
                    ShiftMath.Sign.NONE -> Tokens.success
                    ShiftMath.Sign.SHORTAGE -> Tokens.danger
                    ShiftMath.Sign.SURPLUS -> Tokens.warning
                }
                val label = when (ShiftMath.sign(diff)) {
                    ShiftMath.Sign.NONE -> t("shifts.noDifference", null)
                    ShiftMath.Sign.SHORTAGE -> t("shifts.shortage", null)
                    ShiftMath.Sign.SURPLUS -> t("shifts.surplus", null)
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("${t("shifts.difference", null)} · $label", style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
                    Text(formatMoney(diff.toPlainString()), style = mono.copy(color = color))
                }
                Text(t("shifts.differenceHint", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            }
            AppFormField(t("shifts.note", null), note, { note = it }, enabled = !state.submitting)
            state.error?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger) }
            PillButton(
                text = if (state.submitting) t("common.loading", null) else t("shifts.closeShift", null),
                onClick = { value?.let { onClose(it, note.trim().ifBlank { null }) } },
                enabled = !state.submitting && value != null && value >= 0.0,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
