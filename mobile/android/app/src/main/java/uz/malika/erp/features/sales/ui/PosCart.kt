package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.sales.data.CartLine
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.CaptureSpringItem
import uz.malika.erp.shared.ui.isNew
import uz.malika.erp.shared.ui.rememberCaptureTracker
import uz.malika.erp.shared.ui.rememberReduceMotion
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * The POS cart: one editable card per scanned device (price + warranty days,
 * with a remove button). Each card maps to a `sale.create` at checkout. Render
 * and dispatch only — all state lives in [uz.malika.erp.features.sales.model.PosViewModel].
 */
@Composable
fun PosCartList(
    lines: List<CartLine>,
    onPrice: (imei: String, price: String) -> Unit,
    onWarranty: (imei: String, days: String) -> Unit,
    onRemove: (imei: String) -> Unit,
    enabled: Boolean,
) {
    val t = LocalT.current
    val tracker = rememberCaptureTracker()
    val reduceMotion = rememberReduceMotion()
    Column(Modifier.fillMaxWidth()) {
        Text(t("pos.lineCount", mapOf("count" to lines.size)), style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(8.dp))
        lines.forEach { line ->
            key(line.device.code) {
                CaptureSpringItem(
                    isNew = tracker.isNew(line.device.code),
                    pulse = lines.size,
                    reduceMotion = reduceMotion,
                ) {
                    CartLineCard(line, onPrice, onWarranty, onRemove, enabled)
                }
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
private fun CartLineCard(
    line: CartLine,
    onPrice: (String, String) -> Unit,
    onWarranty: (String, String) -> Unit,
    onRemove: (String) -> Unit,
    enabled: Boolean,
) {
    val t = LocalT.current
    val code = line.device.code
    AppCard(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth()) {
            Column(Modifier.weight(1f)) {
                Text(line.device.modelLabel, style = MaterialTheme.typography.titleSmall)
                Text(code, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily))
            }
            IconButton(onClick = { onRemove(code) }, enabled = enabled) {
                Icon(Icons.Outlined.Close, contentDescription = t("pos.removeLine", null), tint = Tokens.slate)
            }
        }
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth()) {
            AppFormField(
                label = t("pos.salePrice", null),
                value = line.salePrice,
                onValueChange = { onPrice(code, it) },
                keyboardType = KeyboardType.Decimal,
                enabled = enabled,
                modifier = Modifier.weight(1f),
            )
            Spacer(Modifier.width(12.dp))
            AppFormField(
                label = t("pos.warrantyDays", null),
                value = line.warrantyDays,
                onValueChange = { onWarranty(code, it) },
                keyboardType = KeyboardType.Number,
                enabled = enabled,
                modifier = Modifier.weight(1f),
            )
        }
    }
}
