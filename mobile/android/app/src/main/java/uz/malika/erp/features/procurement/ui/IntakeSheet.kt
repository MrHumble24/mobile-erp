package uz.malika.erp.features.procurement.ui

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
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.app.LocalCan
import uz.malika.erp.core.AppException
import uz.malika.erp.features.procurement.data.DeviceModelDto
import uz.malika.erp.features.procurement.data.IntakeDraft
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.features.procurement.data.RegisteredDeviceDto
import uz.malika.erp.features.procurement.data.ShipmentDto
import uz.malika.erp.features.procurement.model.ShipmentsViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.rememberHaptics
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.OfflineBanner
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/**
 * Scan-first device intake for [shipment]: the scanning station leads, the batch
 * defaults follow, and the staged units sit below. Drafts live in [vm] (keyed by
 * shipment id) so dismissing and reopening the sheet restores the batch; submit
 * POSTs the batch (online-only) and clears them. Duplicate IMEIs are blocked
 * client-side before staging and again on the 409.
 */
@Composable
fun IntakeSheet(
    shipment: ShipmentDto,
    models: List<DeviceModelDto>,
    online: Boolean,
    repo: ProcurementRepository,
    vm: ShipmentsViewModel,
    onSaved: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val haptics = rememberHaptics()
    val canCost = LocalCan.current("device.cost.view")
    val canExpense = LocalCan.current("device.expense")
    val canLearn = LocalCan.current("device.update")
    val allDrafts by vm.drafts.collectAsState()
    val drafts = allDrafts[shipment.id].orEmpty()
    val modelNames = remember(models) { models.associate { it.id to it.label } }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var results by remember { mutableStateOf<List<RegisteredDeviceDto>>(emptyList()) }

    fun add(draft: IntakeDraft) {
        // A unit is a duplicate if either of its IMEIs collides with either IMEI
        // of an already-staged unit.
        val newCodes = listOfNotNull(draft.imei, draft.imei2?.takeIf { it.isNotBlank() })
        val staged = drafts.flatMap { listOfNotNull(it.imei, it.imei2?.takeIf { c -> c.isNotBlank() }) }
        if (newCodes.any { it in staged }) {
            error = t("shipments.duplicateImei", null)
            haptics.error() // duplicate IMEI rejected
            return
        }
        vm.stageDraft(shipment.id, draft); error = null
    }

    fun submit() {
        if (drafts.isEmpty()) return
        if (!online) { error = t("sync.offline", null); return }
        busy = true; error = null
        scope.launch {
            try {
                // Keep the registered units' landed costs so the summary matches the web.
                results = repo.addDevices(shipment.id, drafts.toList())
                vm.clearDrafts(shipment.id)
                haptics.success() // batch submitted
                onSaved()
            } catch (e: AppException) {
                error = if (e.statusCode == 409) t("shipments.duplicateImei", null) else e.message
            } finally {
                busy = false
            }
        }
    }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp)) {
            Text(t("shipments.intakeDevices", null), style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.height(Tokens.Space.rowV))
            Text(
                t(
                    "shipments.registeredProgress",
                    mapOf(
                        "registered" to shipment.deviceCount + drafts.size,
                        "expected" to shipment.expectedCount,
                    ),
                ),
                style = MaterialTheme.typography.bodySmall,
            )
            if (!online) {
                Spacer(Modifier.height(Tokens.Space.section))
                OfflineBanner(t("sync.offline", null))
            }
            Spacer(Modifier.height(Tokens.Space.section))
            IntakeDeviceForm(
                models = models,
                canExpense = canExpense,
                online = online,
                canLearn = canLearn,
                repo = repo,
                onAdd = ::add,
            )
            if (drafts.isNotEmpty()) {
                Spacer(Modifier.height(Tokens.Space.section))
                IntakeStagedList(
                    drafts = drafts,
                    modelNames = modelNames,
                    onRemove = { vm.removeDraft(shipment.id, it) },
                )
            }
            error?.let {
                Spacer(Modifier.height(Tokens.Space.gap))
                Text(it, color = Tokens.destructive, style = MaterialTheme.typography.bodyMedium)
            }
            if (canCost && results.isNotEmpty()) {
                Spacer(Modifier.height(Tokens.Space.section))
                LandedResults(results)
            }
            Spacer(Modifier.height(Tokens.Space.section))
            PillButton(
                text = t(if (busy) "common.loading" else "shipments.submitBatch", null),
                onClick = ::submit,
                enabled = !busy && drafts.isNotEmpty() && online,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(Tokens.Space.gap))
        }
    }
}
