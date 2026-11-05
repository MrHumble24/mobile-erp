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
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.CaptureSpringItem
import uz.malika.erp.shared.ui.isNew
import uz.malika.erp.shared.ui.rememberCaptureTracker
import uz.malika.erp.shared.ui.rememberReduceMotion
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * The POS cart: one editable card per line. A unit (phone / serial) shows its
 * price and warranty days; a quantity product shows a stepper, a per-piece price
 * and its line total, warning when the quantity exceeds what is in stock. Each
 * card maps to one `sale.create`. Render and dispatch only.
 */
@Composable
fun PosCartList(
    lines: List<CartLine>,
    onPrice: (key: String, price: String) -> Unit,
    onWarranty: (key: String, days: String) -> Unit,
    onQuantity: (key: String, quantity: Int) -> Unit,
    onRemove: (key: String) -> Unit,
    enabled: Boolean,
) {
    val t = LocalT.current
    val tracker = rememberCaptureTracker()
    val reduceMotion = rememberReduceMotion()
    Column(Modifier.fillMaxWidth()) {
        Text(t("pos.lineCount", mapOf("count" to lines.size)), style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(8.dp))
        lines.forEach { line ->
            key(line.key) {
                CaptureSpringItem(
                    isNew = tracker.isNew(line.key),
                    pulse = lines.size,
                    reduceMotion = reduceMotion,
                ) {
                    when (line) {
                        is CartLine.Unit -> UnitLineCard(line, onPrice, onWarranty, onRemove, enabled)
                        is CartLine.Quantity -> QuantityLineCard(line, onPrice, onQuantity, onRemove, enabled)
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
private fun UnitLineCard(
    line: CartLine.Unit,
    onPrice: (String, String) -> Unit,
    onWarranty: (String, String) -> Unit,
    onRemove: (String) -> Unit,
    enabled: Boolean,
) {
    val t = LocalT.current
    val key = line.key
    AppCard(Modifier.fillMaxWidth()) {
        LineHeader(line.device.modelLabel, line.device.code, key, onRemove, enabled)
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth()) {
            AppFormField(
                label = t("pos.salePrice", null),
                value = line.salePrice,
                onValueChange = { onPrice(key, it) },
                keyboardType = KeyboardType.Decimal,
                enabled = enabled,
                modifier = Modifier.weight(1f),
            )
            Spacer(Modifier.width(12.dp))
            AppFormField(
                label = t("pos.warrantyDays", null),
                value = line.warrantyDays,
                onValueChange = { onWarranty(key, it) },
                keyboardType = KeyboardType.Number,
                enabled = enabled,
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun QuantityLineCard(
    line: CartLine.Quantity,
    onPrice: (String, String) -> Unit,
    onQuantity: (String, Int) -> Unit,
    onRemove: (String) -> Unit,
    enabled: Boolean,
) {
    val t = LocalT.current
    val key = line.key
    AppCard(Modifier.fillMaxWidth()) {
        LineHeader(line.product.label, line.product.barcode ?: "", key, onRemove, enabled)
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Bottom) {
            QuantityStepper(line.quantity, enabled) { onQuantity(key, it) }
            Spacer(Modifier.width(12.dp))
            AppFormField(
                label = t("catalog.unitPrice", null),
                value = line.unitPrice,
                onValueChange = { onPrice(key, it) },
                keyboardType = KeyboardType.Decimal,
                enabled = enabled,
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(t("catalog.lineTotal", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
            Text(
                formatMoney(line.lineTotal.toPlainString()),
                style = MaterialTheme.typography.titleSmall.copy(fontFamily = MonoFamily, color = Tokens.text),
            )
        }
        if (line.overStock) {
            Text(
                t("catalog.belowZero", null),
                style = MaterialTheme.typography.bodySmall,
                color = Tokens.danger,
            )
        }
    }
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
            Text(
                quantity.toString(),
                style = MaterialTheme.typography.titleMedium.copy(fontFamily = MonoFamily, color = Tokens.text),
            )
            IconButton(onClick = { onChange(quantity + 1) }, enabled = enabled) {
                Icon(Icons.Outlined.Add, contentDescription = "+", tint = Tokens.text)
            }
        }
    }
}
