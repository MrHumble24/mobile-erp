package uz.malika.erp.features.shifts.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.features.shifts.model.ShiftBarState
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/**
 * The till's shift bar (ADR 0036): "Open since HH:mm" + Close, or "No open shift"
 * + Open. Pure display — the POS screen owns the sheets and the selling gate.
 */
@Composable
fun ShiftBar(state: ShiftBarState, onOpen: () -> Unit, onClose: () -> Unit, modifier: Modifier = Modifier) {
    val t = LocalT.current
    val current = state.current
    AppCard(modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            if (current != null) {
                Text(
                    "${t("shifts.myShift", null)} · ${t("shifts.openedAt", null)} ${hhmm(current.openedAt)}",
                    style = MaterialTheme.typography.bodyMedium, color = Tokens.text,
                )
                PillButton(t("shifts.closeShift", null), onClose, variant = ButtonVariant.OUTLINE)
            } else {
                Text(t("shifts.shiftRequired", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
                PillButton(t("shifts.openShift", null), onOpen)
            }
        }
    }
}

/** HH:mm from an ISO timestamp (UTC); empty-safe. */
private fun hhmm(iso: String): String = if (iso.length >= 16) iso.substring(11, 16) else iso
