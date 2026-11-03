package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.lifecycle.viewmodel.compose.viewModel
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.procurement.data.ShipmentDto
import uz.malika.erp.features.procurement.data.SupplierDto
import uz.malika.erp.features.procurement.model.AsyncValue
import uz.malika.erp.features.procurement.model.ShipmentSummary
import uz.malika.erp.features.procurement.model.ShipmentsViewModel
import uz.malika.erp.features.procurement.model.procurementVmFactory
import uz.malika.erp.features.procurement.model.rememberProcurementRepository
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.shared.ui.SearchFilterRow
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens

private enum class ShipTab { SHIPMENTS, SUPPLIERS }

private sealed interface Sheet {
    data object NewSupplier : Sheet
    data class EditSupplier(val supplier: SupplierDto) : Sheet
    data object NewShipment : Sheet
    data class EditShipment(val shipment: ShipmentDto) : Sheet
    data class Detail(val shipment: ShipmentDto) : Sheet
    data class Intake(val shipment: ShipmentDto) : Sheet
}

/** `shipments` route: shipment batches + suppliers CRUD. Gated `shipment.read`. */
@Composable
fun ShipmentsScreen(container: AppContainer) {
    val t = LocalT.current
    val online by container.connectivity.online.collectAsState()
    val canManage = LocalCan.current("shipment.manage")
    val canCreate = LocalCan.current("device.create")

    val repo = rememberProcurementRepository(container)
    val vm: ShipmentsViewModel = viewModel(factory = procurementVmFactory { ShipmentsViewModel(repo) })
    val visibleShipments by vm.visibleShipments.collectAsState()
    val visibleSuppliers by vm.visibleSuppliers.collectAsState()
    val summary by vm.summary.collectAsState()
    val suppliersRaw by vm.suppliersRaw.collectAsState()
    val models by vm.models.collectAsState()
    val shipmentQuery by vm.shipmentQuery.collectAsState()
    val supplierQuery by vm.supplierQuery.collectAsState()
    val filters by vm.filters.collectAsState()

    var tab by remember { mutableStateOf(ShipTab.SHIPMENTS) }
    var sheet by remember { mutableStateOf<Sheet?>(null) }
    var showFilters by remember { mutableStateOf(false) }

    val supplierList = (suppliersRaw as? AsyncValue.Data)?.value ?: emptyList()
    val modelNames = (models as? AsyncValue.Data)?.value?.associate { it.id to it.label } ?: emptyMap()
    val supplierNames = supplierList.associate { it.id to it.name }

    Column(
        Modifier.fillMaxSize().padding(Tokens.Space.section),
        verticalArrangement = Arrangement.spacedBy(Tokens.Space.section),
    ) {
        SegmentedControl(
            options = listOf(
                SegmentOption(ShipTab.SHIPMENTS, t("nav.shipments", null)),
                SegmentOption(ShipTab.SUPPLIERS, t("shipments.suppliers", null)),
            ),
            selected = tab,
            onSelect = { tab = it },
            modifier = Modifier.fillMaxWidth(),
        )
        when (tab) {
            ShipTab.SHIPMENTS -> {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    SearchFilterRow(
                        query = shipmentQuery,
                        onQueryChange = vm::setShipmentQuery,
                        placeholder = t("shipments.searchPlaceholder", null),
                        activeCount = filters.activeCount,
                        onOpenFilters = { showFilters = true },
                        modifier = Modifier.weight(1f),
                    )
                    if (canManage) {
                        Spacer(Modifier.width(Tokens.Space.gap))
                        IconButton(onClick = { sheet = Sheet.NewShipment }) {
                            Icon(Icons.Outlined.Add, contentDescription = t("shipments.newShipment", null), tint = Tokens.foreground)
                        }
                    }
                }
                summary?.let { ShipmentsSummary(it) }
                Box(Modifier.weight(1f)) {
                    ShipmentsMasterDetail(
                        state = visibleShipments,
                        supplierNames = supplierNames,
                        modelNames = modelNames,
                        canManage = canManage,
                        canCreate = canCreate,
                        repo = repo,
                        onRetry = vm::refreshShipments,
                        onEdit = { sheet = Sheet.EditShipment(it) },
                        onContinueIntake = { sheet = Sheet.Intake(it) },
                        onOpenSheet = { sheet = Sheet.Detail(it) },
                    )
                }
            }
            ShipTab.SUPPLIERS -> {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    AppTextField(
                        value = supplierQuery,
                        onValueChange = vm::setSupplierQuery,
                        placeholder = t("common.search", null),
                        imeAction = ImeAction.Search,
                        modifier = Modifier.weight(1f),
                    )
                    if (canManage) {
                        Spacer(Modifier.width(Tokens.Space.gap))
                        IconButton(onClick = { sheet = Sheet.NewSupplier }) {
                            Icon(Icons.Outlined.PersonAdd, contentDescription = t("shipments.newSupplier", null), tint = Tokens.foreground)
                        }
                    }
                }
                Box(Modifier.weight(1f)) {
                    SuppliersTab(
                        state = visibleSuppliers,
                        canManage = canManage,
                        onRetry = vm::refreshSuppliers,
                        onEdit = { sheet = Sheet.EditSupplier(it) },
                    )
                }
            }
        }
    }

    if (showFilters) {
        ShipmentsFilterSheet(
            status = filters.status,
            range = filters.range,
            onStatus = vm::setStatus,
            onRange = vm::setRange,
            canReset = filters.isActive || shipmentQuery.isNotBlank(),
            onReset = vm::resetFilters,
            onDismiss = { showFilters = false },
        )
    }

    ShipmentSheets(
        sheet = sheet,
        suppliers = supplierList,
        modelNames = modelNames,
        deviceModels = (models as? AsyncValue.Data)?.value ?: emptyList(),
        canManage = canManage,
        canCreate = canCreate,
        online = online,
        repo = repo,
        vm = vm,
        setSheet = { sheet = it },
    )
}

/**
 * Overview tiles computed from the full loaded list. The web shows "pending
 * intake" units (expected − received), but no i18n label for that exists yet, so
 * the third tile shows received units (`shipments.receivedCount`) instead.
 */
@Composable
private fun ShipmentsSummary(summary: ShipmentSummary) {
    val t = LocalT.current
    MetricGrid(
        perRow = 3,
        tiles = listOf(
            { m -> MetricTile(t("common.total", null), summary.total.toString(), m, money = false) },
            { m -> MetricTile(t("shipments.statusOpen", null), summary.open.toString(), m, money = false) },
            { m -> MetricTile(t("shipments.receivedCount", null), summary.receivedUnits.toString(), m, money = false) },
        ),
    )
}

@Composable
private fun ShipmentSheets(
    sheet: Sheet?,
    suppliers: List<SupplierDto>,
    modelNames: Map<String, String>,
    deviceModels: List<uz.malika.erp.features.procurement.data.DeviceModelDto>,
    canManage: Boolean,
    canCreate: Boolean,
    online: Boolean,
    repo: uz.malika.erp.features.procurement.data.ProcurementRepository,
    vm: ShipmentsViewModel,
    setSheet: (Sheet?) -> Unit,
) {
    val dismiss = { setSheet(null) }
    when (sheet) {
        null -> Unit
        Sheet.NewSupplier -> SupplierFormSheet(null, online, repo, vm::refreshSuppliers, dismiss)
        is Sheet.EditSupplier -> SupplierFormSheet(sheet.supplier, online, repo, vm::refreshSuppliers, dismiss)
        Sheet.NewShipment -> ShipmentFormSheet(
            existing = null, suppliers = suppliers, online = online, repo = repo,
            onSaved = { saved -> vm.refreshShipments(); setSheet(Sheet.Intake(saved)) },
            onDismiss = dismiss,
        )
        is Sheet.EditShipment -> ShipmentFormSheet(
            existing = sheet.shipment, suppliers = suppliers, online = online, repo = repo,
            onSaved = { vm.refreshShipments() }, onDismiss = dismiss,
        )
        is Sheet.Detail -> ShipmentDetailSheet(
            shipment = sheet.shipment, modelNames = modelNames,
            canManage = canManage, canCreate = canCreate, repo = repo,
            onEdit = { setSheet(Sheet.EditShipment(sheet.shipment)) },
            onContinueIntake = { setSheet(Sheet.Intake(sheet.shipment)) },
            onDismiss = dismiss,
        )
        is Sheet.Intake -> IntakeSheet(
            shipment = sheet.shipment, models = deviceModels, online = online, repo = repo,
            onSaved = { vm.refreshShipments() }, onDismiss = dismiss,
        )
    }
}
