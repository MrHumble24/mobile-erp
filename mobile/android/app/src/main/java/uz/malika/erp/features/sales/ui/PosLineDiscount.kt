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
import androidx.compose.ui.text.input.KeyboardType
import uz.malika.erp.features.sales.lib.Discount
import uz.malika.erp.features.sales.lib.DiscountMode
import uz.malika.erp.features.sales.lib.DiscountSettings
import uz.malika.erp.features.sales.lib.PricedLine
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * The per-line discount control (ADR 0034): a percent/amount toggle (only the
 * modes the settings allow), the preset values as quick chips, the typed value,
 * and the final price. Hidden when discounts are off or the line is
 * editable/no-list. When a whole-cart discount is active the line shows its
 * spread share read-only. Limit breaches surface the `pricing.error*` keys.
 */
@Composable
fun LineDiscountControl(
    priced: PricedLine,
    settings: DiscountSettings,
    cartDiscountActive: Boolean,
    enabled: Boolean,
    onChange: (Discount?) -> Unit,
) {
    val t = LocalT.current
    if (!settings.enabled || priced.editable || priced.listTotal == null) return

    Column(Modifier.fillMaxWidth()) {
        Spacer(Modifier.height(Tokens.Space.sm))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(t("pricing.listPrice", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            Text(formatMoney(priced.listTotal.toPlainString()), style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted)
        }
        if (cartDiscountActive) {
            CartSpreadRow(priced)
            return@Column
        }
        Spacer(Modifier.height(Tokens.Space.sm))
        EditableDiscount(priced, settings, enabled, onChange)
        FinalRow(priced)
        priced.rejection?.let {
            Text(t(it.key, it.params), style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
        }
    }
}

@Composable
private fun EditableDiscount(
    priced: PricedLine,
    settings: DiscountSettings,
    enabled: Boolean,
    onChange: (Discount?) -> Unit,
) {
    val t = LocalT.current
    val modes = buildList {
        if (settings.percentAllowed) add(DiscountMode.PERCENT)
        if (settings.amountAllowed) add(DiscountMode.AMOUNT)
    }
    if (modes.isEmpty()) return
    val current = priced.line.discount
    var mode by remember(priced.line.key) { mutableStateOf(current?.mode ?: modes.first()) }
    var text by remember(priced.line.key) { mutableStateOf(current?.value?.stripTrailingZeros()?.toPlainString() ?: "") }

    fun emit(newMode: DiscountMode, newText: String) {
        val v = newText.trim().toBigDecimalOrNull()
        onChange(if (v == null || v.signum() == 0) null else Discount(newMode, v))
    }

    if (modes.size > 1) {
        SegmentedControl(
            options = modes.map { SegmentOption(it, t(if (it == DiscountMode.PERCENT) "pricing.discountPercent" else "pricing.discountAmount", null)) },
            selected = mode,
            onSelect = { mode = it; emit(it, text) },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(Tokens.Space.sm))
    }
    val presets = if (mode == DiscountMode.PERCENT) settings.presetsPercent else settings.presetsAmount
    if (presets.isNotEmpty()) {
        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())) {
            presets.forEach { p ->
                val label = if (mode == DiscountMode.PERCENT) "${p.stripTrailingZeros().toPlainString()}%" else formatMoney(p.toPlainString())
                PillButton(label, onClick = { text = p.stripTrailingZeros().toPlainString(); emit(mode, text) }, variant = ButtonVariant.OUTLINE, enabled = enabled)
                Spacer(Modifier.width(Tokens.Space.sm))
            }
        }
        Spacer(Modifier.height(Tokens.Space.sm))
    }
    AppFormField(
        label = t("pricing.discount", null),
        value = text,
        onValueChange = { text = it; emit(mode, it) },
        keyboardType = KeyboardType.Decimal,
        enabled = enabled,
    )
}

@Composable
private fun FinalRow(priced: PricedLine) {
    val t = LocalT.current
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(t("pricing.finalPrice", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
        Text(
            formatMoney(priced.finalPrice.toPlainString()),
            style = MaterialTheme.typography.titleSmall.copy(fontFamily = MonoFamily, color = if (priced.discountAmount.signum() > 0) Tokens.success else Tokens.text),
        )
    }
}

@Composable
private fun CartSpreadRow(priced: PricedLine) {
    val t = LocalT.current
    if (priced.discountAmount.signum() > 0) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(t("pricing.discountOnCart", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            Text("-" + formatMoney(priced.discountAmount.toPlainString()), style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.success)
        }
    }
    FinalRow(priced)
}
