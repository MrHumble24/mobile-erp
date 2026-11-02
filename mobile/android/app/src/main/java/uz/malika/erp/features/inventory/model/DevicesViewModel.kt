package uz.malika.erp.features.inventory.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import uz.malika.erp.features.inventory.data.DeviceDetail
import uz.malika.erp.features.inventory.data.DeviceHistoryEntry
import uz.malika.erp.features.inventory.data.DeviceListItem
import uz.malika.erp.features.inventory.data.DeviceRepository

/**
 * Offline-first device list: the Room mirror narrowed by [filter], with live
 * metrics. Also fronts the online device reads/writes (detail, history, edit,
 * status) so the detail sheet keeps no repository of its own.
 */
class DevicesViewModel(private val repo: DeviceRepository) : ViewModel() {

    private val _filter = MutableStateFlow(DeviceFilter())
    val filter: StateFlow<DeviceFilter> = _filter.asStateFlow()

    private val devices: StateFlow<List<DeviceListItem>> = repo.watchDevices()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val filtered: StateFlow<List<DeviceListItem>> =
        combine(devices, _filter) { list, f -> f.apply(list) }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val metrics: StateFlow<DeviceMetrics> = devices
        .map(DeviceMetrics::from)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), DeviceMetrics())

    fun setSearch(v: String) { _filter.value = _filter.value.copy(search = v) }
    fun setModel(v: String?) { _filter.value = _filter.value.copy(modelId = v) }
    fun setStorage(v: String?) { _filter.value = _filter.value.copy(storage = v) }
    fun setStatus(v: String?) { _filter.value = _filter.value.copy(statusCode = v) }
    fun toggleStatus(code: String) {
        _filter.value = _filter.value.copy(
            statusCode = if (_filter.value.statusCode == code) null else code,
        )
    }
    fun clear() { _filter.value = DeviceFilter() }

    suspend fun detail(imei: String): DeviceDetail = repo.detailByImei(imei)
    suspend fun history(id: String): List<DeviceHistoryEntry> = repo.history(id)
    suspend fun update(id: String, specs: Map<String, Any>, targetPrice: Double?) =
        repo.update(id, specs, targetPrice)
    suspend fun changeStatus(id: String, toStatusCode: String, expectedVersion: Int, reason: String?) =
        repo.changeStatus(id, toStatusCode, expectedVersion, reason)
}
