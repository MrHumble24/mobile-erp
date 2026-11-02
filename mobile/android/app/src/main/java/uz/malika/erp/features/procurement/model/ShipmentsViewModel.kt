package uz.malika.erp.features.procurement.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import uz.malika.erp.features.procurement.data.DeviceModelDto
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.features.procurement.data.ShipmentDto
import uz.malika.erp.features.procurement.data.SupplierDto

/**
 * State for the Shipments screen (both tabs). Owns the shipments list, the
 * suppliers list (names + create/edit picker) and the device-model catalog
 * (name map + intake spec schema). Sheets call the matching refresh after a
 * successful write — the online-only writes themselves live in the sheets.
 */
class ShipmentsViewModel(private val repo: ProcurementRepository) : ViewModel() {

    private val _shipments = MutableStateFlow<AsyncValue<List<ShipmentDto>>>(AsyncValue.Loading)
    val shipments: StateFlow<AsyncValue<List<ShipmentDto>>> = _shipments.asStateFlow()

    private val _suppliers = MutableStateFlow<AsyncValue<List<SupplierDto>>>(AsyncValue.Loading)
    val suppliers: StateFlow<AsyncValue<List<SupplierDto>>> = _suppliers.asStateFlow()

    private val _models = MutableStateFlow<AsyncValue<List<DeviceModelDto>>>(AsyncValue.Loading)
    val models: StateFlow<AsyncValue<List<DeviceModelDto>>> = _models.asStateFlow()

    init {
        refreshShipments()
        refreshSuppliers()
        _models.reload(viewModelScope) { repo.deviceModels() }
    }

    fun refreshShipments() = _shipments.reload(viewModelScope) { repo.shipments() }
    fun refreshSuppliers() = _suppliers.reload(viewModelScope) { repo.suppliers() }

    val repository: ProcurementRepository get() = repo
}
