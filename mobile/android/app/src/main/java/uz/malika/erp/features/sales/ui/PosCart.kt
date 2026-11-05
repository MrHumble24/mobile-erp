package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Remove
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.sales.data.CartLine
import uz.malika.erp.features.sales.lib.Discount
import uz.malika.erp.features.sales.lib.DiscountSettings
import uz.malika.erp.features.sales.lib.PricedCart
import uz.malika.erp.features.sales.lib.PricedLine
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.CaptureSpringItem
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.isNew
import uz.malika.erp.shared.ui.rememberCaptureTracker
import uz.malika.erp.shared.ui.rememberReduceMotion
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** Callbacks the cart line cards dispatch (render and dispatch only). */
class CartActions(
    val onPrice: (key: String, price: String) -> Unit,
    val onWarranty: (key: String, days: String) -> Unit,
    val onQuantity: (key: String, quantity: Int) -> Unit,
    val onRemove: (key: String) -> Unit,
    val onLineDiscount: (key: String, discount: Discount?) -> Unit,
    val onToggleOverride: (key: String) -> Unit,
)

/**
 * The POS cart priced at the current level (ADR 0034). A list-priced line shows
 * its list price, a discount control and the final price; a line with no list
 * price (or an override) keeps the typed price field. One card per `sale.create`.
 */
@Composable
fun PosCartList(
    priced: PricedCart,
    settings: DiscountSettings,
    cartDiscountActive: Boolean,
    canOverride: Boolean,
    actions: CartActions,
    enabled: Boolean,
) {
    val t = LocalT.current
    val tracker = rememberCaptureTracker()
    val reduceMotion = rememberReduceMotion()
    Column(Modifier.fillMaxWidth()) {
        Text(t("pos.lineCount", mapOf("count" to priced.lines.size)), style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(8.dp))
        priced.lines.forEach { p ->
            key(p.line.key) {
                CaptureSpringItem(isNew = tracker.isNew(p.line.key), pulse = priced.lines.size, reduceMotion = reduceMotion) {
                    when (p.line) {
                        is CartLine.Unit -> UnitLineCard(p, settings, cartDiscountActive, canOverride, actions, enabled)
                        is CartLine.Quantity -> QuantityLineCard(p, settings, cartDiscountActive, canOverride, actions, enabled)
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
private fun UnitLineCard(p: PricedLine, settings: DiscountSettings, cartActive: Boolean, canOverride: Boolean, a: CartActions, enabled: Boolean) {
    val t = LocalT.current
    val line = p.line as CartLine.Unit
    val key = line.key
    AppCard(Modifier.fillMaxWidth()) {
        LineHeader(line.device.modelLabel, line.device.code, key, a.onRemove, enabled)
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth()) {
            if (p.editable) {
                AppFormField(t("pos.salePrice", null), line.salePrice, { a.onPrice(key, it) }, keyboardType = KeyboardType.Decimal, enabled = enabled, modifier = Modifier.weight(1f))
                Spacer(Modifier.width(12.dp))
            }
            AppFormField(t("pos.warrantyDays", null), line.warrantyDays, { a.onWarranty(key, it) }, keyboardType = KeyboardType.Number, enabled = enabled, modifier = Modifier.weight(1f))
        }
        LineDiscountControl(p, settings, cartActive, enabled, onChange = { a.onLineDiscount(key, it) })
        OverrideToggle(p, canOverride, enabled) { a.onToggleOverride(key) }
    }
}

@Composable
private fun QuantityLineCard(p: PricedLine, settings: DiscountSettings, cartActive: Boolean, canOverride: Boolean, a: CartActions, enabled: Boolean) {
    val t = LocalT.current
    val line = p.line as CartLine.Quantity
    val key = line.key
    AppCard(Modifier.fillMaxWidth()) {
        LineHeader(line.product.label, line.product.barcode ?: "", key, a.onRemove, enabled)
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Bottom) {
            QuantityStepper(line.quantity, enabled) { a.onQuantity(key, it) }
            Spacer(Modifier.width(12.dp))
            if (p.editable) {
                AppFormField(t("catalog.unitPrice", null), line.unitPrice, { a.onPrice(key, it) }, keyboardType = KeyboardType.Decimal, enabled = enabled, modifier = Modifier.weight(1f))
            }
        }
        if (p.editable) {
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(t("catalog.lineTotal", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
                Text(formatMoney(p.finalPrice.toPlainString()), style = MaterialTheme.typography.titleSmall.copy(fontFamily = MonoFamily, color = Tokens.text))
            }
        }
        LineDiscountControl(p, settings, cartActive, enabled, onChange = { a.onLineDiscount(key, it) })
        OverrideToggle(p, canOverride, enabled) { a.onToggleOverride(key) }
        if (line.overStock) {
            Text(t("catalog.belowZero", null), style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
        }
    }
}

/** "Type a price" / "use list price" toggle — only for a list-priced line and `sale.price.override`. */
@Composable
private fun OverrideToggle(p: PricedLine, canOverride: Boolean, enabled: Boolean, onToggle: () -> Unit) {
    val t = LocalT.current
    if (!canOverride || p.listTotal == null) return
    Spacer(Modifier.height(4.dp))
    PillButton(
        text = if (p.editable) t("pricing.listPrice", null) else t("pricing.priceOverride", null),
        onClick = onToggle,
        variant = ButtonVariant.GHOST,
        enabled = enabled,
    )
}

@Composable
private fun LineHeader(title: String, sub: String, key: String, onRemove: (String) -> Unit, enabled: Boolean) {
    val t = LocalT.current
    Row(Modifier.fillMaxWidth()) {
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleSmall)
            if (sub.isNotBlank()) {
                Text(sub, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted)
            }
        }
        IconButton(onClick = { onRemove(key) }, enabled = enabled) {
            Icon(Icons.Outlined.Close, contentDescription = t("pos.removeLine", null), tint = Tokens.slate)
        }
    }
}

@Composable
private fun QuantityStepper(quantity: Int, enabled: Boolean, onChange: (Int) -> Unit) {
    val t = LocalT.current
    Column {
        Text(t("catalog.quantity", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        Spacer(Modifier.height(6.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { onChange(quantity - 1) }, enabled = enabled && quantity > 1) {
                Icon(Icons.Outlined.Remove, contentDescription = "−", tint = Tokens.text)
            }
            Text(quantity.toString(), style = MaterialTheme.typography.titleMedium.copy(fontFamily = MonoFamily, color = Tokens.text))
            IconButton(onClick = { onChange(quantity + 1) }, enabled = enabled) {
                Icon(Icons.Outlined.Add, contentDescription = "+", tint = Tokens.text)
            }
        }
    }
}
