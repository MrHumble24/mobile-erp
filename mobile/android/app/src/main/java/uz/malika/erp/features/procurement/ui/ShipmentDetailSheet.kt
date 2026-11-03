package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.procurement.data.DeviceRowDto
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.features.procurement.data.ShipmentDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.PageState
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.isCompactWidth
import uz.malika.erp.ui.theme.Tokens

/** Shipment summary + its registered devices (paginated), as a phone bottom sheet. */
@Composable
fun ShipmentDetailSheet(
    shipment: ShipmentDto,
    modelNames: Map<String, String>,
    canManage: Boolean,
    canCreate: Boolean,
    repo: ProcurementRepository,
    onEdit: () -> Unit,
    onContinueIntake: () -> Unit,
    onDismiss: () -> Unit,
) {
    AppBottomSheet(onDismiss = onDismiss) {
        ShipmentDetailContent(
            shipment = shipment,
            modelNames = modelNames,
            canManage = canManage,
            canCreate = canCreate,
            repo = repo,
            onEdit = onEdit,
            onContinueIntake = onContinueIntake,
            modifier = Modifier.padding(16.dp),
        )
    }
}

/**
 * The detail body itself — reused as a phone bottom sheet ([ShipmentDetailSheet])
 * and as the tablet master-detail pane. Loads the registered devices one page
 * at a time (load-more).
 */
@Composable
fun ShipmentDetailContent(
    shipment: ShipmentDto,
    modelNames: Map<String, String>,
    canManage: Boolean,
    canCreate: Boolean,
    repo: ProcurementRepository,
    onEdit: () -> Unit,
    onContinueIntake: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    var devices by remember(shipment.id) { mutableStateOf(PageState<DeviceRowDto>()) }
    var loaded by remember(shipment.id) { mutableStateOf(false) }

    suspend fun load(page: Int) {
        devices = devices.copy(loading = true)
        devices = try {
            val dto = repo.devices(shipmentId = shipment.id, page = page)
            devices.append(dto.items, dto.total, page)
        } catch (_: AppException) {
            devices.copy(loading = false)
        }
        loaded = true
    }

    LaunchedEffect(shipment.id) { load(1) }

    Column(modifier) {
        Text(t("shipments.detailTitle", null), style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(4.dp))
        Text(
            t("shipments.registeredProgress", mapOf("registered" to shipment.deviceCount, "expected" to shipment.expectedCount)),
            style = MaterialTheme.typography.bodySmall,
        )
        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            if (canManage) {
                PillButton(t("shipments.editShipment", null), onEdit, variant = ButtonVariant.OUTLINE, modifier = Modifier.weight(1f))
            }
            if (canCreate) {
                PillButton(t("shipments.continueIntake", null), onContinueIntake, modifier = Modifier.weight(1f))
            }
        }
        Spacer(Modifier.height(16.dp))
        when {
            !loaded -> Loading()
            devices.items.isEmpty() -> EmptyView(t("shipments.noDevices", null))
            else -> {
                DevicesTable(devices.items, modelNames)
                LoadMoreFooter(
                    hasMore = devices.hasMore,
                    loading = devices.loading,
                    onLoadMore = { scope.launch { load(devices.nextPage) } },
                )
            }
        }
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun DevicesTable(rows: List<DeviceRowDto>, modelNames: Map<String, String>) {
    val t = LocalT.current
    val showCost = rows.any { it.landedCost != null }
    if (isCompactWidth()) {
        Column {
            rows.forEach { d ->
                Column(Modifier.fillMaxWidth().padding(vertical = 10.dp)) {
                    ImeiText(d.imei, style = MaterialTheme.typography.bodyMedium)
                    d.imei2?.takeIf { it.isNotBlank() }?.let {
                        ImeiText(it, style = MaterialTheme.typography.bodySmall.copy(color = Tokens.mutedForeground))
                    }
                    Text(
                        modelNames[d.modelId] ?: d.modelId,
                        style = MaterialTheme.typography.bodySmall,
                        color = Tokens.mutedForeground,
                    )
                    Row(Modifier.fillMaxWidth().padding(top = 4.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Text(
                            "${t("common.status", null)}: ${d.statusCode}",
                            style = MaterialTheme.typography.bodySmall,
                            color = Tokens.mutedForeground,
                        )
                        if (showCost && d.landedCost != null) {
                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    "${t("shipments.avgLandedPerUnit", null)}:",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Tokens.mutedForeground,
                                )
                                MoneyText(
                                    d.landedCost,
                                    style = MaterialTheme.typography.bodySmall.copy(color = Tokens.mutedForeground),
                                )
                            }
                        }
                    }
                }
                HorizontalDivider(color = Tokens.border)
            }
        }
        return
    }
    Column {
        Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("IMEI", style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1.4f))
            Text(t("common.status", null), style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1f))
            if (showCost) {
                Text(t("shipments.avgLandedPerUnit", null), style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1f))
            }
        }
        HorizontalDivider(color = Tokens.border)
        rows.forEach { d ->
            Row(Modifier.fillMaxWidth().padding(vertical = 10.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Column(Modifier.weight(1.4f)) {
                    ImeiText(d.imei, style = MaterialTheme.typography.bodyMedium)
                    d.imei2?.takeIf { it.isNotBlank() }?.let {
                        ImeiText(it, style = MaterialTheme.typography.bodySmall.copy(color = Tokens.mutedForeground))
                    }
                    Text(modelNames[d.modelId] ?: d.modelId, style = MaterialTheme.typography.bodySmall)
                }
                Text(d.statusCode, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                if (showCost) {
                    MoneyText(d.landedCost, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                }
            }
            HorizontalDivider(color = Tokens.border)
        }
    }
}
