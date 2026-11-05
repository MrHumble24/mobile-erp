package uz.malika.erp.features.stock.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
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
import uz.malika.erp.features.stock.data.AdjustStockBody
import uz.malika.erp.features.stock.data.StockLevel
import uz.malika.erp.features.stock.data.StockMath
import uz.malika.erp.features.stock.data.StockRepository
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Write-off or count-correction form (ADR 0030). Write-off removes a positive
 * quantity and needs a reason. Count correction takes the counted shelf quantity
 * and shows the difference (counted − current) before saving; the server writes
 * that difference. Neither moves money.
 */
@Composable
fun StockAdjustDialog(
    level: StockLevel,
    type: String,
    repo: StockRepository,
    onClose: () -> Unit,
    onSaved: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val isWriteOff = type == "WRITE_OFF"

    var quantity by remember { mutableStateOf("") }
    var counted by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val qtyInt = quantity.trim().toIntOrNull()
    val countedInt = counted.trim().toIntOrNull()
    val diff = countedInt?.let { StockMath.countDifference(level.quantity, it) }
    val valid = if (isWriteOff) (qtyInt != null && qtyInt > 0 && note.isNotBlank()) else (countedInt != null && countedInt >= 0)

    fun save() {
        busy = true
        error = null
        scope.launch {
            try {
                repo.adjust(
                    AdjustStockBody(
                        modelId = level.modelId,
                        type = type,
                        quantity = if (isWriteOff) qtyInt else null,
                        countedQuantity = if (isWriteOff) null else countedInt,
                        note = note.trim().ifBlank { null },
                    ),
                )
                onSaved()
            } catch (e: Exception) {
                busy = false
                error = (e as? AppException)?.message ?: "error"
            }
        }
    }

    AlertDialog(
        onDismissRequest = { if (!busy) onClose() },
        shape = RoundedCornerShape(Tokens.Radius.large),
        containerColor = Tokens.card,
        title = { Text(t(if (isWriteOff) "catalog.writeOff" else "catalog.countCorrection", null), style = MaterialTheme.typography.titleMedium) },
        text = {
            Column {
                Text(level.label, style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
                Spacer(Modifier.height(12.dp))
                if (isWriteOff) {
                    AppFormField(
                        label = t("catalog.quantity", null),
                        value = quantity,
                        onValueChange = { quantity = it },
                        keyboardType = KeyboardType.Number,
                        enabled = !busy,
                    )
                    Spacer(Modifier.height(12.dp))
                    AppFormField(
                        label = t("catalog.adjustReason", null),
                        value = note,
                        onValueChange = { note = it },
                        enabled = !busy,
                    )
                } else {
                    AppFormField(
                        label = t("catalog.countedQuantity", null),
                        value = counted,
                        onValueChange = { counted = it },
                        keyboardType = KeyboardType.Number,
                        enabled = !busy,
                    )
                    Spacer(Modifier.height(8.dp))
                    // Show the difference the server will write (counted − current).
                    diff?.let {
                        Text(
                            "${t("catalog.onHand", null)}: ${level.quantity}   →   ${if (it >= 0) "+$it" else it.toString()}",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontFamily = MonoFamily,
                                color = if (it < 0) Tokens.danger else Tokens.success,
                            ),
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    AppFormField(
                        label = t("catalog.adjustReason", null),
                        value = note,
                        onValueChange = { note = it },
                        enabled = !busy,
                    )
                }
                error?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
                }
            }
        },
        confirmButton = {
            PillButton(t("common.save", null), onClick = { save() }, enabled = !busy && valid)
        },
        dismissButton = {
            PillButton(t("common.cancel", null), onClick = onClose, variant = ButtonVariant.SECONDARY, enabled = !busy)
        },
    )
}
