package uz.malika.erp.features.procurement.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.graphics.Color
import uz.malika.erp.features.procurement.data.ShipmentDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/**
 * Intake progress derived from the batch counts (the DTO carries no status
 * code): no units yet → OPEN, some but not all → PARTIAL, all expected in →
 * RECEIVED. A CANCELLED state exists on the web but is not in this DTO, so it is
 * not reachable here — add it when the shipment endpoint returns a status code.
 */
enum class ShipmentStatus { OPEN, PARTIAL, RECEIVED }

fun shipmentStatus(shipment: ShipmentDto): ShipmentStatus = when {
    shipment.deviceCount <= 0 -> ShipmentStatus.OPEN
    shipment.deviceCount < shipment.expectedCount -> ShipmentStatus.PARTIAL
    else -> ShipmentStatus.RECEIVED
}

/** Semantic color per progress state, mirroring `DeviceStatusMeta.color`. */
@Composable
@ReadOnlyComposable
fun shipmentStatusColor(status: ShipmentStatus): Color = when (status) {
    ShipmentStatus.OPEN -> Tokens.info
    ShipmentStatus.PARTIAL -> Tokens.warning
    ShipmentStatus.RECEIVED -> Tokens.success
}

/**
 * Progress chip for a shipment. PARTIAL has no dedicated i18n label yet, so it
 * reuses `statusOpen` (still an open batch) and is told apart by the warning
 * tint; RECEIVED uses `statusComplete`.
 */
@Composable
fun ShipmentStatusChip(shipment: ShipmentDto) {
    val t = LocalT.current
    val status = shipmentStatus(shipment)
    val labelKey = if (status == ShipmentStatus.RECEIVED) "shipments.statusComplete" else "shipments.statusOpen"
    StatusChip(label = t(labelKey, null), color = shipmentStatusColor(status))
}
