package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.sales.model.SalesViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.payments.ui.accountLabel
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.shared.ui.Toaster
import uz.malika.erp.ui.theme.Tokens

/**
 * Process-return dialog. Returns are ONLINE-ONLY (not an offline mutation type),
 * so submit blocks with a needs-connection message when offline. On success it
 * toasts and closes; the error shows inline (it may be retried).
 */
@Composable
fun ReturnDialog(
    vm: SalesViewModel,
    saleId: String,
    online: Boolean,
    toaster: Toaster,
    refundAccounts: List<String> = emptyList(),
    onClose: () -> Unit,
) {
    val t = LocalT.current
    val ui by vm.ret.collectAsState()
    var refund by remember { mutableStateOf("") }
    var reason by remember { mutableStateOf("") }
    var condition by remember { mutableStateOf("IN_STOCK") }

    LaunchedEffect(ui.done) {
        if (ui.done) { toaster.success(t("sales.returnSuccess", null)); vm.resetReturn(); onClose() }
    }

    AlertDialog(
        onDismissRequest = { if (!ui.busy) { vm.resetReturn(); onClose() } },
        shape = RoundedCornerShape(Tokens.Radius.large),
        containerColor = Tokens.card,
        tonalElevation = 0.dp,
        title = { Text(t("sales.returnDevice", null), style = MaterialTheme.typography.titleMedium) },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                AppFormField(
                    label = t("sales.refundAmount", null),
                    value = refund,
                    onValueChange = { refund = it },
                    enabled = !ui.busy,
                    keyboardType = KeyboardType.Decimal,
                )
                Spacer(Modifier.height(12.dp))
                AppFormField(
                    label = t("sales.returnReason", null),
                    value = reason,
                    onValueChange = { reason = it },
                    enabled = !ui.busy,
                )
                Spacer(Modifier.height(12.dp))
                Text(t("sales.returnCondition", null), style = MaterialTheme.typography.labelLarge)
                Spacer(Modifier.height(6.dp))
                SegmentedControl(
                    options = listOf(
                        SegmentOption("IN_STOCK", t("sales.returnToStock", null)),
                        SegmentOption("DEFECTIVE", t("sales.returnToDefective", null)),
                    ),
                    selected = condition,
                    onSelect = { condition = it },
                )
                if (refundAccounts.isNotEmpty()) {
                    Spacer(Modifier.height(12.dp))
                    val names = refundAccounts.joinToString(", ") { accountLabel(it, emptyList(), t) }
                    Text(
                        t("sales.refundGoesBack", mapOf("accounts" to names)),
                        style = MaterialTheme.typography.bodySmall,
                        color = Tokens.muted,
                    )
                }
                ui.error?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(t(it, null), color = Tokens.danger, style = MaterialTheme.typography.bodySmall)
                }
            }
        },
        confirmButton = {
            PillButton(
                text = t("sales.returnDevice", null),
                onClick = {
                    vm.submitReturn(saleId, parseMoney(refund).toDouble(), condition, reason.trim(), online)
                },
                enabled = !ui.busy,
            )
        },
        dismissButton = {
            PillButton(
                text = t("common.cancel", null),
                onClick = { vm.resetReturn(); onClose() },
                variant = ButtonVariant.SECONDARY,
                enabled = !ui.busy,
            )
        },
    )
}
