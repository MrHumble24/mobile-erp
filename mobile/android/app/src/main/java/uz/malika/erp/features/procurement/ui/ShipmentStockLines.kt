package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.procurement.data.DeviceModelDto
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.features.procurement.data.PurchaseItemBody
import uz.malika.erp.features.procurement.data.ShipmentStockLineDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.payments.ui.accountLabel
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens
import java.math.BigDecimal

/**
 * Add quantity stock to a shipment (ADR 0030): pick a QUANTITY product, enter the
 * pieces and the cost per piece, see the line total and the account the money
 * leaves. Each add posts `POST /shipments/:id/items`; [stockLines] are the
 * shipment's persisted purchase lines from `GET /shipments/:id` (ADR 0034).
 */
@Composable
fun ShipmentStockLines(
    shipmentId: String,
    paymentAccountCode: String?,
    quantityModels: List<DeviceModelDto>,
    stockLines: List<ShipmentStockLineDto>,
    stockLinesTotal: String?,
    online: Boolean,
    repo: ProcurementRepository,
    onChanged: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    var model by remember { mutableStateOf<DeviceModelDto?>(null) }
    var quantity by remember { mutableStateOf("") }
    var unitCost by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val qty = quantity.trim().toIntOrNull()
    val cost = unitCost.trim().toDoubleOrNull()
    val lineTotal = if (qty != null && cost != null) parseMoney(unitCost).multiply(BigDecimal(qty)) else BigDecimal.ZERO
    val valid = model != null && qty != null && qty > 0 && cost != null && cost > 0

    fun add() {
        val m = model ?: return
        busy = true
        error = null
        scope.launch {
            try {
                repo.addItems(shipmentId, listOf(PurchaseItemBody(m.id, qty!!, cost!!)))
                onChanged()
                model = null; quantity = ""; unitCost = ""
            } catch (e: Exception) {
                error = (e as? AppException)?.message ?: "error"
            } finally {
                busy = false
            }
        }
    }

    Column(Modifier.fillMaxWidth()) {
        Text(t("catalog.addStock", null), style = MaterialTheme.typography.titleSmall, color = Tokens.text)
        Text(t("catalog.addStockHint", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.sm))
        AppSelect(
            label = t("inventory.model", null),
            value = model,
            options = quantityModels,
            optionLabel = DeviceModelDto::label,
            onSelect = { model = it },
            placeholder = t("inventory.model", null),
            enabled = !busy && online,
        )
        Spacer(Modifier.height(Tokens.Space.sm))
        Row(Modifier.fillMaxWidth()) {
            AppFormField(
                label = t("catalog.quantity", null),
                value = quantity,
                onValueChange = { quantity = it },
                keyboardType = KeyboardType.Number,
                enabled = !busy && online,
                modifier = Modifier.weight(1f),
            )
            Spacer(Modifier.width(12.dp))
            AppFormField(
                label = t("catalog.unitCost", null),
                value = unitCost,
                onValueChange = { unitCost = it },
                keyboardType = KeyboardType.Decimal,
                enabled = !busy && online,
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(Modifier.height(Tokens.Space.sm))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(t("catalog.lineTotal", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
            Text(
                formatMoney(lineTotal.toPlainString()),
                style = MaterialTheme.typography.titleSmall.copy(fontFamily = MonoFamily, color = Tokens.text),
            )
        }
        paymentAccountCode?.let {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(t("balance.payFrom", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                Text(accountLabel(it, emptyList(), t), style = MaterialTheme.typography.bodySmall, color = Tokens.text)
            }
        }
        error?.let {
            Spacer(Modifier.height(Tokens.Space.xs))
            Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
        }
        Spacer(Modifier.height(Tokens.Space.sm))
        PillButton(
            text = t("catalog.addStock", null),
            onClick = { add() },
            modifier = Modifier.fillMaxWidth(),
            variant = ButtonVariant.OUTLINE,
            enabled = valid && !busy && online,
        )

        if (stockLines.isNotEmpty()) {
            Spacer(Modifier.height(Tokens.Space.md))
            stockLines.forEach { line ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(
                        "${line.label}  × ${line.quantity}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Tokens.text,
                    )
                    line.lineTotal?.let {
                        Text(
                            formatMoney(it),
                            style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily),
                            color = Tokens.text,
                        )
                    }
                }
            }
            stockLinesTotal?.let {
                Spacer(Modifier.height(Tokens.Space.xs))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(t("catalog.stockValue", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
                    Text(formatMoney(it), style = MaterialTheme.typography.titleSmall.copy(fontFamily = MonoFamily), color = Tokens.text)
                }
            }
        }
    }
}
