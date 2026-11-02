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
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.procurement.data.DeviceRowDto
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.features.procurement.data.ShipmentDto
import uz.malika.erp.features.procurement.model.AsyncContent
import uz.malika.erp.features.procurement.model.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/**
 * Shipment summary + its registered devices (first page; batches rarely exceed
 * 50). Hosts the edit and continue-intake actions, gated by permission codes.
 */
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
    val t = LocalT.current
    val devices = rememberAsync(shipment.id) { repo.devices(shipmentId = shipment.id).items }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.padding(16.dp)) {
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
            AsyncContent(devices) { rows ->
                if (rows.isEmpty()) {
                    EmptyView(t("shipments.noDevices", null))
                } else {
                    DevicesTable(rows, modelNames)
                }
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
private fun DevicesTable(rows: List<DeviceRowDto>, modelNames: Map<String, String>) {
    val t = LocalT.current
    val showCost = rows.any { it.landedCost != null }
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
