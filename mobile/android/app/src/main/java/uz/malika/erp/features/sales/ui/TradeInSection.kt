package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.features.sales.model.PosState
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * The cart's "Trade-in" action + the traded-in phones listed as negative rows
 * (ADR 0039). Shown only to a user with `purchase.create`. Trade-in is online
 * only and needs a chosen customer; it is never offered with "On credit".
 */
@Composable
fun TradeInSection(
    state: PosState,
    online: Boolean,
    customerChosen: Boolean,
    onOpenAdd: () -> Unit,
    onRemove: (String) -> Unit,
) {
    val t = LocalT.current
    if (!state.canTradeIn) return
    if (state.lines.isEmpty() && state.tradeIns.isEmpty()) return

    Column(Modifier.fillMaxWidth()) {
        PillButton(
            text = t("purchases.tradeInAction", null),
            onClick = onOpenAdd,
            modifier = Modifier.fillMaxWidth(),
            variant = ButtonVariant.OUTLINE,
            enabled = online && state.lines.isNotEmpty() && customerChosen,
        )
        if (!online) {
            Spacer(Modifier.height(Tokens.Space.rowV))
            Text(t("purchases.tradeInOffline", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        } else if (!customerChosen && state.lines.isNotEmpty()) {
            Spacer(Modifier.height(Tokens.Space.rowV))
            Text(t("purchases.tradeInNeedsCustomer", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        }
        state.tradeIns.forEach { ti ->
            Spacer(Modifier.height(Tokens.Space.sm))
            AppCard(Modifier.fillMaxWidth()) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(ti.modelLabel, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                        if (ti.code.isNotBlank()) {
                            Text(ti.code, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted)
                        }
                    }
                    Text(
                        "− ${formatMoney(ti.value.toPlainString())}",
                        style = MaterialTheme.typography.titleSmall.copy(fontFamily = MonoFamily, color = Tokens.danger),
                    )
                    IconButton(onClick = { onRemove(ti.id) }) {
                        Icon(Icons.Outlined.Close, contentDescription = t("common.close", null), tint = Tokens.slate)
                    }
                }
            }
        }
        if (!state.tradeInPlan.ok) {
            Spacer(Modifier.height(Tokens.Space.rowV))
            Text(
                t("purchases.tradeInExceedsLine", mapOf("model" to tradeInLabel(state))),
                style = MaterialTheme.typography.bodySmall,
                color = Tokens.warning,
            )
        }
        if (state.tradeIns.isNotEmpty()) {
            Spacer(Modifier.height(Tokens.Space.sm))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(t("purchases.amountPaid", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
                Text(
                    formatMoney(state.amountToPay.toPlainString()),
                    style = MaterialTheme.typography.titleMedium.copy(fontFamily = MonoFamily, color = Tokens.text),
                )
            }
        }
    }
}

/** The model of the first trade-in that fits no single line (for the warning). */
private fun tradeInLabel(state: PosState): String {
    val id = state.tradeInPlan.unplaceableId
    return state.tradeIns.firstOrNull { it.id == id }?.modelLabel ?: ""
}
