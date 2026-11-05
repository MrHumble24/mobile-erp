package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.sales.lib.CartTotals
import uz.malika.erp.features.sales.lib.Discount
import uz.malika.erp.features.sales.lib.DiscountMode
import uz.malika.erp.features.sales.lib.DiscountSettings
import uz.malika.erp.features.sales.lib.PriceLevel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** The price-level control (ADR 0034): walk-in / wholesale / shops; re-prices the cart. */
@Composable
fun LevelControl(level: String, onSelect: (String) -> Unit) {
    val t = LocalT.current
    Column(Modifier.fillMaxWidth()) {
        Text(t("pricing.priceLevel", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        Spacer(Modifier.height(6.dp))
        SegmentedControl(
            options = PriceLevel.ALL.map { SegmentOption(it, t(PriceLevel.labelKey(it), null)) },
            selected = level,
            onSelect = onSelect,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

/** Totals: sum of list prices, total discount (when any), and the amount to pay. */
@Composable
fun CartTotalsView(totals: CartTotals) {
    val t = LocalT.current
    Column(Modifier.fillMaxWidth()) {
        TotalRow(t("pricing.listPrice", null), formatMoney(totals.listSum.toPlainString()), muted = true)
        if (totals.discountSum.signum() > 0) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(t("pricing.discountsGiven", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
                Text("-" + formatMoney(totals.discountSum.toPlainString()), style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.success)
            }
        }
        Spacer(Modifier.height(4.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(t("pos.totalDue", null), style = MaterialTheme.typography.titleMedium)
            Text(formatMoney(totals.payable.toPlainString()), style = MaterialTheme.typography.titleMedium.copy(fontFamily = MonoFamily, fontWeight = FontWeight.Bold))
        }
    }
}

@Composable
private fun TotalRow(label: String, value: String, muted: Boolean) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = if (muted) Tokens.muted else Tokens.text)
        Text(value, style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = if (muted) Tokens.muted else Tokens.text)
    }
}

/** A whole-cart discount (ADR 0034): spreads over the list-priced lines. */
@Composable
fun CartDiscountControl(settings: DiscountSettings, current: Discount?, enabled: Boolean, onChange: (Discount?) -> Unit) {
    val t = LocalT.current
    if (!settings.enabled) return
    val modes = buildList {
        if (settings.percentAllowed) add(DiscountMode.PERCENT)
        if (settings.amountAllowed) add(DiscountMode.AMOUNT)
    }
    if (modes.isEmpty()) return
    var mode by remember { mutableStateOf(current?.mode ?: modes.first()) }
    var text by remember { mutableStateOf(current?.value?.stripTrailingZeros()?.toPlainString() ?: "") }

    fun emit(m: DiscountMode, s: String) {
        val v = s.trim().toBigDecimalOrNull()
        onChange(if (v == null || v.signum() == 0) null else Discount(m, v))
    }

    Column(Modifier.fillMaxWidth()) {
        Text(t("pricing.discountOnCart", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        Spacer(Modifier.height(6.dp))
        if (modes.size > 1) {
            SegmentedControl(
                options = modes.map { SegmentOption(it, t(if (it == DiscountMode.PERCENT) "pricing.discountPercent" else "pricing.discountAmount", null)) },
                selected = mode,
                onSelect = { mode = it; emit(it, text) },
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
        }
        val presets = if (mode == DiscountMode.PERCENT) settings.presetsPercent else settings.presetsAmount
        if (presets.isNotEmpty()) {
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())) {
                presets.forEach { p ->
                    val label = if (mode == DiscountMode.PERCENT) "${p.stripTrailingZeros().toPlainString()}%" else formatMoney(p.toPlainString())
                    PillButton(label, onClick = { text = p.stripTrailingZeros().toPlainString(); emit(mode, text) }, variant = ButtonVariant.OUTLINE, enabled = enabled)
                    Spacer(Modifier.width(8.dp))
                }
            }
            Spacer(Modifier.height(8.dp))
        }
        AppFormField(
            label = t("pricing.discount", null),
            value = text,
            onValueChange = { text = it; emit(mode, it) },
            keyboardType = KeyboardType.Decimal,
            enabled = enabled,
        )
    }
}
