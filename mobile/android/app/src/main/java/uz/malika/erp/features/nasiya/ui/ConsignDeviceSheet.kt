package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.features.nasiya.model.ConsignEntry
import uz.malika.erp.features.nasiya.model.ConsignWriteViewModel
import uz.malika.erp.features.nasiya.model.isValidImei
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.ScannerField

private class RowInput(imei: String = "") {
    var imei by mutableStateOf(imei)
    var price by mutableStateOf("")
}

/**
 * Consign one-or-many devices to a partner (offline-capable via the outbox).
 * Scan to append a device row, set each price, pick a due date. When launched
 * from a partner's ledger the partner is locked.
 */
@Composable
fun ConsignDeviceSheet(
    container: AppContainer,
    lockedPartnerId: String?,
    lockedPartnerName: String?,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val vm: ConsignWriteViewModel = viewModel(
        factory = viewModelFactory { initializer { ConsignWriteViewModel(container) } },
    )
    val state by vm.state.collectAsState()
    LaunchedEffect(state.done) { if (state.done) onDismiss() }

    val partners by container.db.partnerDao().watchAll().collectAsState(initial = emptyList())
    var partnerId by remember { mutableStateOf(lockedPartnerId ?: "") }
    var dueDate by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    val rows = remember { mutableStateListOf(RowInput()) }

    val validRows = rows.filter { isValidImei(it.imei.trim()) && (it.price.trim().toDoubleOrNull() ?: 0.0) > 0.0 }
    val dueOk = dueDate.trim().length == 10
    val canSubmit = partnerId.isNotEmpty() && dueOk && validRows.isNotEmpty() && !state.submitting

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().padding(20.dp).heightIn(max = 560.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(t("consignments.newConsignment", null), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)

            if (lockedPartnerId != null) {
                Text("${t("consignments.partner", null)}: ${lockedPartnerName ?: lockedPartnerId}", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
            } else {
                PartnerPicker(
                    partners = partners.map { it.id to it.shopName },
                    selectedId = partnerId,
                    onSelect = { partnerId = it },
                )
            }

            Text(t("consignments.device", null), style = MaterialTheme.typography.labelLarge)
            ScannerField(
                onScan = { code, _ -> rows.add(RowInput(code.trim())) },
                placeholder = t("consignments.searchPlaceholder", null),
                autofocus = false,
            )

            rows.forEachIndexed { index, row ->
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("${t("consignments.device", null)} #${index + 1}", style = MaterialTheme.typography.labelMedium)
                        if (rows.size > 1) {
                            PillButton(t("consignments.removeDevice", null), onClick = { rows.removeAt(index) }, variant = ButtonVariant.GHOST)
                        }
                    }
                    AppFormField(
                        label = "IMEI",
                        value = row.imei,
                        onValueChange = { row.imei = it },
                        keyboardType = KeyboardType.Number,
                        error = if (row.imei.isNotBlank() && !isValidImei(row.imei.trim())) t("common.required", null) else null,
                    )
                    AppFormField(t("consignments.agreedPrice", null), row.price, { row.price = it }, keyboardType = KeyboardType.Number)
                }
            }
            PillButton(t("consignments.addDevice", null), onClick = { rows.add(RowInput()) }, variant = ButtonVariant.OUTLINE, modifier = Modifier.fillMaxWidth())

            DueDatePicker(t("consignments.dueDate", null), dueDate, { dueDate = it })
            AppFormField(t("common.notes", null), notes, { notes = it })
            ActionError(state.error, state.offline)

            PillButton(
                text = if (state.submitting) t("common.loading", null) else t("consignments.newConsignment", null),
                onClick = {
                    vm.consign(
                        partnerId = partnerId,
                        dueDateIso = "${dueDate.trim()}T00:00:00.000Z",
                        notes = notes.trim().ifBlank { null },
                        rows = validRows.map { ConsignEntry(it.imei.trim(), it.price.trim().toDouble()) },
                    )
                },
                enabled = canSubmit,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
