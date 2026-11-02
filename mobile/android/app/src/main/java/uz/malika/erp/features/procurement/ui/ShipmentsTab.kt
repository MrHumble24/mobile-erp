package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.features.procurement.data.ShipmentDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/** Below this width the detail opens as a bottom sheet; at/above it, a side pane. */
private const val TABLET_MIN_DP = 720

/**
 * Shipments list with adaptive detail: a bottom sheet on phones, a master-detail
 * side pane on tablets (≥ [TABLET_MIN_DP]dp). [onOpenSheet] drives the phone path.
 */
@Composable
fun ShipmentsMasterDetail(
    shipments: List<ShipmentDto>,
    supplierNames: Map<String, String>,
    modelNames: Map<String, String>,
    canManage: Boolean,
    canCreate: Boolean,
    repo: ProcurementRepository,
    onNew: () -> Unit,
    onEdit: (ShipmentDto) -> Unit,
    onContinueIntake: (ShipmentDto) -> Unit,
    onOpenSheet: (ShipmentDto) -> Unit,
) {
    val t = LocalT.current
    BoxWithConstraints(Modifier.fillMaxSize()) {
        if (maxWidth < TABLET_MIN_DP.dp) {
            ShipmentsTab(shipments, supplierNames, canManage, onNew, onOpenSheet)
            return@BoxWithConstraints
        }
        var selectedId by remember { mutableStateOf<String?>(null) }
        val selected = shipments.firstOrNull { it.id == selectedId }
        Row(Modifier.fillMaxSize()) {
            Box(Modifier.weight(1f).fillMaxHeight()) {
                ShipmentsTab(shipments, supplierNames, canManage, onNew, onOpen = { selectedId = it.id })
            }
            Box(Modifier.weight(1.3f).fillMaxHeight().verticalScroll(rememberScrollState())) {
                if (selected == null) {
                    EmptyView(t("shipments.selectShipment", null))
                } else {
                    ShipmentDetailContent(
                        shipment = selected,
                        modelNames = modelNames,
                        canManage = canManage,
                        canCreate = canCreate,
                        repo = repo,
                        onEdit = { onEdit(selected) },
                        onContinueIntake = { onContinueIntake(selected) },
                        modifier = Modifier.padding(16.dp),
                    )
                }
            }
        }
    }
}

/** Shipment batches list (a tab of the Shipments screen), newest-first. */
@Composable
fun ShipmentsTab(
    shipments: List<ShipmentDto>,
    supplierNames: Map<String, String>,
    canManage: Boolean,
    onNew: () -> Unit,
    onOpen: (ShipmentDto) -> Unit,
) {
    val t = LocalT.current
    Column(Modifier.fillMaxWidth()) {
        if (canManage) {
            Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.End) {
                PillButton(t("shipments.newShipment", null), onNew)
            }
        }
        if (shipments.isEmpty()) {
            EmptyView(t("shipments.emptyHint", null))
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(shipments, key = { it.id }) { s ->
                    ShipmentCard(s, supplierNames[s.supplierId] ?: s.supplierId, onOpen)
                }
            }
        }
    }
}

@Composable
private fun ShipmentCard(shipment: ShipmentDto, supplierName: String, onOpen: (ShipmentDto) -> Unit) {
    val t = LocalT.current
    AppCard(onClick = { onOpen(shipment) }) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(supplierName, style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(4.dp))
                Text(
                    shipment.dateLabel + " · " + t(
                        "shipments.registeredProgress",
                        mapOf("registered" to shipment.deviceCount, "expected" to shipment.expectedCount),
                    ),
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            StatusChip(
                label = t(if (shipment.isComplete) "shipments.statusComplete" else "shipments.statusOpen", null),
                color = if (shipment.isComplete) Tokens.success else Tokens.warning,
            )
            Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = Tokens.ash)
        }
    }
}
