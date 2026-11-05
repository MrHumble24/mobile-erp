package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import kotlinx.coroutines.launch
import uz.malika.erp.AppContainer
import uz.malika.erp.features.nasiya.model.ConsignEntry
import uz.malika.erp.features.nasiya.model.ConsignWriteViewModel
import uz.malika.erp.features.nasiya.model.isValidUnitCode
import uz.malika.erp.features.sales.lib.PriceCache
import uz.malika.erp.features.sales.lib.PriceLevel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.ScannerField
import uz.malika.erp.shared.ui.SubjectBlock
import uz.malika.erp.ui.theme.Tokens

private class RowInput(imei: String = "") {
    var imei by mutableStateOf(imei)
    var price by mutableStateOf("")
    /** True when [price] was prefilled from the unit's PARTNER list price (ADR 0034). */
    var partnerPrefilled by mutableStateOf(false)
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
    val scope = rememberCoroutineScope()
    var partnerId by remember { mutableStateOf(lockedPartnerId ?: "") }
    var dueDate by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    val rows = remember { mutableStateListOf(RowInput()) }

    // Prefill the agreed price with the unit's PARTNER list price (ADR 0034) on scan.
    fun addScanned(code: String) {
        val row = RowInput(code)
        rows.add(row)
        scope.launch {
            val dev = runCatching { container.db.deviceDao().findByImei(code) }.getOrNull()
            PriceCache.parse(dev?.pricesJson)?.get(PriceLevel.PARTNER)?.takeIf { it.isNotBlank() }?.let {
                row.price = it
                row.partnerPrefilled = true
            }
        }
    }

    val validRows = rows.filter { isValidUnitCode(it.imei.trim()) && (it.price.trim().toDoubleOrNull() ?: 0.0) > 0.0 }
    val dueOk = dueDate.trim().length == 10
    val canSubmit = partnerId.isNotEmpty() && dueOk && validRows.isNotEmpty() && !state.submitting

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().padding(Tokens.Space.gutter).heightIn(max = 600.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.md),
        ) {
            Text(t("consignments.newConsignment", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)

            if (lockedPartnerId != null) {
                SubjectBlock(t("consignments.partner", null), lockedPartnerName ?: lockedPartnerId, mono = false)
            } else {
                PartnerPicker(
                    partners = partners.map { it.id to it.shopName },
                    selectedId = partnerId,
                    onSelect = { partnerId = it },
                )
            }

            Text(t("consignments.devices", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
            ScannerField(
                onScan = { code, _ -> addScanned(code.trim()) },
                placeholder = t("consignments.searchPlaceholder", null),
                autofocus = false,
            )

            // Each device is a surface-2 block inside the sheet, never a nested card.
            rows.forEachIndexed { index, row ->
                Column(
                    Modifier.fillMaxWidth()
                        .background(Tokens.surface2, RoundedCornerShape(Tokens.Radius.controls))
                        .padding(Tokens.Space.lg),
                    verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm),
                ) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("${t("consignments.device", null)} #${index + 1}", style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
                        if (rows.size > 1) {
                            PillButton(t("consignments.removeDevice", null), onClick = { rows.removeAt(index) }, variant = ButtonVariant.GHOST)
                        }
                    }
                    AppFormField(
                        label = t("catalog.unitCode", null),
                        value = row.imei,
                        onValueChange = { row.imei = it },
                        error = if (row.imei.isNotBlank() && !isValidUnitCode(row.imei.trim())) t("common.required", null) else null,
                    )
                    AppFormField(t("consignments.agreedPrice", null), row.price, { row.price = it; row.partnerPrefilled = false }, keyboardType = KeyboardType.Number)
                    if (row.partnerPrefilled) {
                        Text(t("pricing.partnerPriceUsed", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                    }
                }
            }
            PillButton(t("consignments.addDevice", null), onClick = { rows.add(RowInput()) }, variant = ButtonVariant.SECONDARY, modifier = Modifier.fillMaxWidth())

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
