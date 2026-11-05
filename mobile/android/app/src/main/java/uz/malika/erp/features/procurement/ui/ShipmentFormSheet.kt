package uz.malika.erp.features.procurement.ui
import uz.malika.erp.shared.ui.AppSelect

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AppException
import uz.malika.erp.features.procurement.data.CreateShipmentBody
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.features.procurement.data.ShipmentDto
import uz.malika.erp.features.procurement.data.SupplierDto
import uz.malika.erp.features.procurement.data.UpdateShipmentBody
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.payments.PaymentSplit
import uz.malika.erp.shared.payments.ui.AccountPicker
import uz.malika.erp.shared.payments.ui.accountLabel
import uz.malika.erp.shared.payments.ui.rememberAccountOptions
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.features.procurement.lib.millisToDate
import uz.malika.erp.ui.theme.Tokens

/**
 * Create or edit a shipment (online-only). On create, [onSaved] receives the
 * saved shipment so the caller can chain into device intake.
 */
@Composable
fun ShipmentFormSheet(
    container: AppContainer,
    existing: ShipmentDto?,
    suppliers: List<SupplierDto>,
    online: Boolean,
    repo: ProcurementRepository,
    onSaved: (ShipmentDto) -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val editing = existing != null
    var supplierId by remember { mutableStateOf(existing?.supplierId) }
    var date by remember { mutableStateOf(existing?.dateLabel ?: millisToDate()) }
    var expected by remember { mutableStateOf(existing?.expectedCount?.toString() ?: "") }
    var notes by remember { mutableStateOf(existing?.notes ?: "") }
    var account by remember { mutableStateOf(existing?.paymentAccountCode ?: PaymentSplit.CASH) }
    val accounts by rememberAccountOptions(container)
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    fun submit() {
        val count = expected.trim().toIntOrNull()
        if (count == null || count < 0) { error = t("common.required", null); return }
        if (!editing && supplierId == null) { error = t("shipments.selectSupplier", null); return }
        if (!online) { error = t("common.offline", null); return }
        busy = true; error = null
        val iso = "${date}T00:00:00.000Z"
        scope.launch {
            try {
                val saved = if (existing == null) {
                    repo.createShipment(
                        CreateShipmentBody(supplierId!!, iso, count, notes.trim().ifBlank { null }, account),
                    )
                } else {
                    repo.updateShipment(
                        existing.id,
                        UpdateShipmentBody(iso, count, notes.trim().ifBlank { null }),
                    )
                }
                onSaved(saved); onDismiss()
            } catch (e: AppException) {
                error = e.message
            } finally {
                busy = false
            }
        }
    }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp)) {
            Text(
                t(if (editing) "shipments.editShipment" else "shipments.createShipment", null),
                style = MaterialTheme.typography.titleLarge,
            )
            Spacer(Modifier.height(16.dp))
            if (!editing) {
                AppSelect(
                    label = t("shipments.supplier", null),
                    value = suppliers.firstOrNull { it.id == supplierId },
                    options = suppliers.filter { it.isActive },
                    optionLabel = { it.name },
                    onSelect = { supplierId = it?.id },
                    placeholder = t("shipments.selectSupplier", null),
                )
                Spacer(Modifier.height(12.dp))
            }
            AppDateField(t("shipments.shipmentDate", null), date, { date = it })
            Spacer(Modifier.height(12.dp))
            AppFormField(
                t("shipments.expectedCount", null), expected, { expected = it },
                keyboardType = KeyboardType.Number,
            )
            Spacer(Modifier.height(12.dp))
            if (editing) {
                // The server fixes the paying account at creation — show it, do not edit it.
                Text(t("balance.payFrom", null), style = MaterialTheme.typography.labelLarge, color = Tokens.mutedForeground)
                Text(accountLabel(account, accounts, t), style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
            } else {
                AccountPicker(
                    label = t("balance.payFrom", null),
                    selected = account,
                    options = accounts,
                    onSelect = { account = it },
                )
            }
            Spacer(Modifier.height(12.dp))
            AppFormField(t("common.notes", null), notes, { notes = it })
            error?.let {
                Spacer(Modifier.height(12.dp))
                Text(it, color = Tokens.destructive, style = MaterialTheme.typography.bodyMedium)
            }
            Spacer(Modifier.height(20.dp))
            PillButton(
                text = t(if (busy) "common.loading" else "common.save", null),
                onClick = ::submit,
                enabled = !busy,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
        }
    }
}
