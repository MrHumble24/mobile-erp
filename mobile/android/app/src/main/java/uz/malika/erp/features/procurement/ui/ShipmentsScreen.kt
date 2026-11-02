package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.procurement.data.ShipmentDto
import uz.malika.erp.features.procurement.data.SupplierDto
import uz.malika.erp.features.procurement.model.AsyncContent
import uz.malika.erp.features.procurement.model.AsyncValue
import uz.malika.erp.features.procurement.model.ShipmentsViewModel
import uz.malika.erp.features.procurement.model.procurementVmFactory
import uz.malika.erp.features.procurement.model.rememberProcurementRepository
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl

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
    val shipments by vm.shipments.collectAsState()
    val suppliers by vm.suppliers.collectAsState()
    val models by vm.models.collectAsState()

    var tab by remember { mutableStateOf(ShipTab.SHIPMENTS) }
    var sheet by remember { mutableStateOf<Sheet?>(null) }

    val supplierList = (suppliers as? AsyncValue.Data)?.value ?: emptyList()
    val modelNames = (models as? AsyncValue.Data)?.value?.associate { it.id to it.label } ?: emptyMap()

    Column(Modifier.fillMaxSize()) {
        SegmentedControl(
            options = listOf(
                SegmentOption(ShipTab.SHIPMENTS, t("shipments.title", null)),
                SegmentOption(ShipTab.SUPPLIERS, t("shipments.suppliers", null)),
            ),
            selected = tab,
            onSelect = { tab = it },
            modifier = Modifier.fillMaxWidth().padding(16.dp),
        )
        when (tab) {
            ShipTab.SHIPMENTS -> AsyncContent(shipments, onRetry = vm::refreshShipments) { list ->
                ShipmentsTab(
                    shipments = list,
                    supplierNames = supplierList.associate { it.id to it.name },
                    canManage = canManage,
                    onNew = { sheet = Sheet.NewShipment },
                    onOpen = { sheet = Sheet.Detail(it) },
                )
            }
            ShipTab.SUPPLIERS -> AsyncContent(suppliers, onRetry = vm::refreshSuppliers) { list ->
                SuppliersTab(
                    suppliers = list,
                    canManage = canManage,
                    onNew = { sheet = Sheet.NewSupplier },
                    onEdit = { sheet = Sheet.EditSupplier(it) },
                )
            }
        }
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
