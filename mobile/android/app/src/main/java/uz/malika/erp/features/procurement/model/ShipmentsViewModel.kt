package uz.malika.erp.features.procurement.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import uz.malika.erp.features.procurement.data.DeviceModelDto
import uz.malika.erp.features.procurement.data.IntakeDraft
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.features.procurement.data.PurchasedLineDto
import uz.malika.erp.features.procurement.data.ShipmentDto
import uz.malika.erp.features.procurement.data.SupplierDto
import uz.malika.erp.features.procurement.lib.millisToDate
import uz.malika.erp.shared.ui.DateRange

/** The shipment status facet in the filter sheet (client-side, from counts). */
enum class ShipmentStatusFilter { ALL, OPEN, RECEIVED }

/** Client-side shipment filters: status facet + date range (applied in the VM). */
data class ShipmentFilters(
    val status: ShipmentStatusFilter = ShipmentStatusFilter.ALL,
    val range: DateRange = DateRange(),
) {
    val activeCount: Int
        get() = (if (status != ShipmentStatusFilter.ALL) 1 else 0) +
            (if (range.startMillis != null || range.endMillis != null) 1 else 0)

    val isActive: Boolean get() = activeCount > 0
}

/** Overview counts for the summary tiles, computed from the full loaded list. */
data class ShipmentSummary(val total: Int, val open: Int, val receivedUnits: Int, val expectedUnits: Int)

/**
 * State for the Shipments screen (both tabs). Owns the shipments list, the
 * suppliers list (names + create/edit picker) and the device-model catalog
 * (name map + intake spec schema). The repo endpoints take no filter params, so
 * search (supplier/date/notes), the status + date-range facets and the supplier
 * search are all applied client-side here as flows derived from the raw lists.
 * Sheets call the matching refresh after a successful write.
 */
class ShipmentsViewModel(private val repo: ProcurementRepository) : ViewModel() {

    private val _shipments = MutableStateFlow<AsyncValue<List<ShipmentDto>>>(AsyncValue.Loading)
    private val _suppliers = MutableStateFlow<AsyncValue<List<SupplierDto>>>(AsyncValue.Loading)
    private val _models = MutableStateFlow<AsyncValue<List<DeviceModelDto>>>(AsyncValue.Loading)

    val suppliersRaw: StateFlow<AsyncValue<List<SupplierDto>>> = _suppliers.asStateFlow()
    val models: StateFlow<AsyncValue<List<DeviceModelDto>>> = _models.asStateFlow()

    private val _shipmentQuery = MutableStateFlow("")
    val shipmentQuery: StateFlow<String> = _shipmentQuery.asStateFlow()

    private val _supplierQuery = MutableStateFlow("")
    val supplierQuery: StateFlow<String> = _supplierQuery.asStateFlow()

    private val _filters = MutableStateFlow(ShipmentFilters())
    val filters: StateFlow<ShipmentFilters> = _filters.asStateFlow()

    val visibleShipments: StateFlow<AsyncValue<List<ShipmentDto>>> =
        combine(_shipments, _suppliers, _shipmentQuery, _filters) { ships, sups, query, f ->
            ships.mapData { list -> filterShipments(list, supplierNames(sups), query, f) }
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), AsyncValue.Loading)

    val visibleSuppliers: StateFlow<AsyncValue<List<SupplierDto>>> =
        combine(_suppliers, _supplierQuery) { sups, query ->
            sups.mapData { list -> filterSuppliers(list, query) }
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), AsyncValue.Loading)

    val summary: StateFlow<ShipmentSummary?> =
        _shipments.map { (it as? AsyncValue.Data)?.value?.let(::summarize) }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    init {
        refreshShipments()
        refreshSuppliers()
        _models.reload(viewModelScope) { repo.deviceModels() }
    }

    fun refreshShipments() = _shipments.reload(viewModelScope) { repo.shipments() }
    fun refreshSuppliers() = _suppliers.reload(viewModelScope) { repo.suppliers() }

    // Devices staged in the intake loop, keyed by shipment id. Held here (not in
    // the sheet) so dismissing and reopening the intake sheet restores the batch;
    // submit() clears the shipment's drafts on success.
    private val _drafts = MutableStateFlow<Map<String, List<IntakeDraft>>>(emptyMap())
    val drafts: StateFlow<Map<String, List<IntakeDraft>>> = _drafts.asStateFlow()

    private fun draftsList(shipmentId: String) = _drafts.value[shipmentId].orEmpty()

    fun stageDraft(shipmentId: String, draft: IntakeDraft) {
        _drafts.value = _drafts.value + (shipmentId to (draftsList(shipmentId) + draft))
    }

    fun removeDraft(shipmentId: String, index: Int) {
        val list = draftsList(shipmentId)
        if (index !in list.indices) return
        _drafts.value = _drafts.value + (shipmentId to (list.filterIndexed { i, _ -> i != index }))
    }

    fun clearDrafts(shipmentId: String) { _drafts.value = _drafts.value - shipmentId }

    // Quantity purchase lines added to a shipment this session, keyed by shipment
    // id. The server has no read-back for them, so the detail shows what was added
    // here (ADR 0030). Held in the VM so reopening the detail keeps them.
    private val _items = MutableStateFlow<Map<String, List<PurchasedLineDto>>>(emptyMap())
    val items: StateFlow<Map<String, List<PurchasedLineDto>>> = _items.asStateFlow()

    fun recordItems(shipmentId: String, lines: List<PurchasedLineDto>) {
        _items.value = _items.value + (shipmentId to (_items.value[shipmentId].orEmpty() + lines))
    }

    fun setShipmentQuery(q: String) { _shipmentQuery.value = q }
    fun setSupplierQuery(q: String) { _supplierQuery.value = q }
    fun setStatus(s: ShipmentStatusFilter) { _filters.value = _filters.value.copy(status = s) }
    fun setRange(r: DateRange) { _filters.value = _filters.value.copy(range = r) }
    fun resetFilters() {
        _filters.value = ShipmentFilters()
        _shipmentQuery.value = ""
    }

    val repository: ProcurementRepository get() = repo
}

private fun supplierNames(sups: AsyncValue<List<SupplierDto>>): Map<String, String> =
    (sups as? AsyncValue.Data)?.value?.associate { it.id to it.name } ?: emptyMap()

private fun filterShipments(
    list: List<ShipmentDto>,
    names: Map<String, String>,
    query: String,
    f: ShipmentFilters,
): List<ShipmentDto> {
    val q = query.trim().lowercase()
    val from = f.range.startMillis?.let(::millisToDate)
    val to = f.range.endMillis?.let(::millisToDate)
    return list.filter { s ->
        val name = names[s.supplierId] ?: s.supplierId
        val matchesQuery = q.isEmpty() ||
            name.lowercase().contains(q) ||
            s.dateLabel.contains(q) ||
            s.notes?.lowercase()?.contains(q) == true
        val matchesStatus = when (f.status) {
            ShipmentStatusFilter.ALL -> true
            ShipmentStatusFilter.OPEN -> !s.isComplete
            ShipmentStatusFilter.RECEIVED -> s.isComplete
        }
        // dateLabel is ISO yyyy-MM-dd, so lexical compare == chronological.
        val matchesFrom = from == null || s.dateLabel >= from
        val matchesTo = to == null || s.dateLabel <= to
        matchesQuery && matchesStatus && matchesFrom && matchesTo
    }
}

private fun filterSuppliers(list: List<SupplierDto>, query: String): List<SupplierDto> {
    val q = query.trim().lowercase()
    if (q.isEmpty()) return list
    return list.filter {
        it.name.lowercase().contains(q) ||
            it.contact?.lowercase()?.contains(q) == true ||
            it.country?.lowercase()?.contains(q) == true
    }
}

private fun summarize(list: List<ShipmentDto>) = ShipmentSummary(
    total = list.size,
    open = list.count { !it.isComplete },
    receivedUnits = list.sumOf { it.deviceCount },
    expectedUnits = list.sumOf { it.expectedCount },
)
