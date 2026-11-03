package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
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
import uz.malika.erp.features.procurement.model.AsyncContent
import uz.malika.erp.features.procurement.model.AsyncValue
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.listBottomPadding
import uz.malika.erp.ui.theme.Tokens

/** Below this width the detail opens as a bottom sheet; at/above it, a side pane. */
private const val TABLET_MIN_DP = 720

/**
 * Shipments list with adaptive detail: a bottom sheet on phones, a master-detail
 * side pane on tablets (≥ [TABLET_MIN_DP]dp). [onOpenSheet] drives the phone path.
 * Search, summary and the Add action live one level up on the screen.
 */
@Composable
fun ShipmentsMasterDetail(
    state: AsyncValue<List<ShipmentDto>>,
    supplierNames: Map<String, String>,
    modelNames: Map<String, String>,
    canManage: Boolean,
    canCreate: Boolean,
    repo: ProcurementRepository,
    onRetry: () -> Unit,
    onEdit: (ShipmentDto) -> Unit,
    onContinueIntake: (ShipmentDto) -> Unit,
    onOpenSheet: (ShipmentDto) -> Unit,
) {
    val t = LocalT.current
    BoxWithConstraints(Modifier.fillMaxSize()) {
        if (maxWidth < TABLET_MIN_DP.dp) {
            ShipmentsList(state, supplierNames, onRetry, onOpenSheet)
            return@BoxWithConstraints
        }
        var selectedId by remember { mutableStateOf<String?>(null) }
        val list = (state as? AsyncValue.Data)?.value.orEmpty()
        val selected = list.firstOrNull { it.id == selectedId }
        Row(Modifier.fillMaxSize()) {
            Box(Modifier.weight(1f).fillMaxHeight()) {
                ShipmentsList(state, supplierNames, onRetry, onOpen = { selectedId = it.id })
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
                        modifier = Modifier.padding(Tokens.Space.section),
                    )
                }
            }
        }
    }
}

/** Shipment batches list (newest-first), with loading/error/empty states. */
@Composable
private fun ShipmentsList(
    state: AsyncValue<List<ShipmentDto>>,
    supplierNames: Map<String, String>,
    onRetry: () -> Unit,
    onOpen: (ShipmentDto) -> Unit,
) {
    val t = LocalT.current
    AsyncContent(state, onRetry = onRetry) { list ->
        if (list.isEmpty()) {
            EmptyView(t("common.notFound", null), compact = true)
        } else {
            LazyColumn(
                contentPadding = listBottomPadding(),
                verticalArrangement = Arrangement.spacedBy(Tokens.Space.gap),
            ) {
                items(list, key = { it.id }) { s ->
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
                Text(
                    shipment.dateLabel + " · " + t(
                        "shipments.registeredProgress",
                        mapOf("registered" to shipment.deviceCount, "expected" to shipment.expectedCount),
                    ),
                    style = MaterialTheme.typography.titleMedium,
                )
                Spacer(Modifier.height(4.dp))
                Text(supplierName, style = MaterialTheme.typography.bodySmall, color = Tokens.mutedForeground)
            }
            ShipmentStatusChip(shipment)
            Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = Tokens.ash)
        }
    }
}
