package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
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
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/**
 * Loop-add devices to [shipment] then POST the batch (online-only). Duplicate
 * IMEIs are blocked client-side before the staged list and again on the 409.
 */
@Composable
fun IntakeSheet(
    shipment: ShipmentDto,
    models: List<DeviceModelDto>,
    online: Boolean,
    repo: ProcurementRepository,
    onSaved: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val canCost = LocalCan.current("device.cost.view")
    val drafts = remember { mutableStateListOf<IntakeDraft>() }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var results by remember { mutableStateOf<List<RegisteredDeviceDto>>(emptyList()) }

    fun add(draft: IntakeDraft) {
        if (drafts.any { it.imei == draft.imei }) { error = t("shipments.duplicateImei", null); return }
        drafts.add(draft); error = null
    }

    fun submit() {
        if (drafts.isEmpty()) return
        if (!online) { error = t("common.offline", null); return }
        busy = true; error = null
        scope.launch {
            try {
                // Keep the registered units' landed costs so the summary matches the web.
                results = repo.addDevices(shipment.id, drafts.toList())
                drafts.clear()
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
            Spacer(Modifier.height(4.dp))
            Text(
                t("shipments.registeredProgress", mapOf("registered" to drafts.size, "expected" to shipment.expectedCount)),
                style = MaterialTheme.typography.bodySmall,
            )
            Spacer(Modifier.height(16.dp))
            IntakeDeviceForm(models = models, onAdd = ::add)
            if (drafts.isNotEmpty()) {
                Spacer(Modifier.height(20.dp))
                Text(t("shipments.deviceList", null), style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(8.dp))
                drafts.forEachIndexed { i, draft ->
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            ImeiText(draft.imei, style = MaterialTheme.typography.bodyMedium)
                            if (draft.specs.isNotEmpty()) {
                                Text(draft.specs.values.joinToString(" · "), style = MaterialTheme.typography.bodySmall)
                            }
                        }
                        IconButton(onClick = { drafts.removeAt(i) }) {
                            Icon(Icons.Outlined.Close, contentDescription = null)
                        }
                    }
                }
            }
            error?.let {
                Spacer(Modifier.height(12.dp))
                Text(it, color = Tokens.destructive, style = MaterialTheme.typography.bodyMedium)
            }
            if (canCost && results.isNotEmpty()) {
                Spacer(Modifier.height(20.dp))
                LandedResults(results)
            }
            Spacer(Modifier.height(20.dp))
            PillButton(
                text = t(if (busy) "common.loading" else "shipments.submitBatch", null),
                onClick = ::submit,
                enabled = !busy && drafts.isNotEmpty(),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
        }
    }
}

/** Per-device landed cost returned by the server after a batch is registered. */
@Composable
private fun LandedResults(results: List<RegisteredDeviceDto>) {
    val t = LocalT.current
    Column(
        Modifier
            .fillMaxWidth()
            .background(Tokens.mist, RoundedCornerShape(12.dp))
            .border(BorderStroke(1.dp, Tokens.bone), RoundedCornerShape(12.dp))
            .padding(12.dp),
    ) {
        Text(t("shipments.landedCostResults", null), style = MaterialTheme.typography.titleSmall)
        Spacer(Modifier.height(8.dp))
        results.forEach { r ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                ImeiText(r.imei, style = MaterialTheme.typography.bodySmall)
                MoneyText(r.landedCost, style = MaterialTheme.typography.bodySmall)
            }
            Spacer(Modifier.height(4.dp))
        }
    }
}
