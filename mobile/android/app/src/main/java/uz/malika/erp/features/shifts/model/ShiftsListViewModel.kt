package uz.malika.erp.features.shifts.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.shifts.data.ShiftListItem
import uz.malika.erp.features.shifts.data.ShiftRepository
import uz.malika.erp.shared.ui.DateRange

data class ShiftsListState(
    val loading: Boolean = true,
    val error: String? = null,
    val items: List<ShiftListItem> = emptyList(),
)

/**
 * The shifts list (ADR 0036): newest first, with a date range and — only with
 * `shift.manage` — a cashier filter. Online only (`/shifts` has no offline feed).
 */
class ShiftsListViewModel(private val repo: ShiftRepository) : ViewModel() {

    private val _range = MutableStateFlow(DateRange())
    val range = _range.asStateFlow()

    private val _cashierId = MutableStateFlow<String?>(null)
    val cashierId = _cashierId.asStateFlow()

    private val _state = MutableStateFlow(ShiftsListState())
    val state = _state.asStateFlow()

    init { reload() }

    fun setRange(range: DateRange) { _range.value = range; reload() }
    fun setCashier(id: String?) { _cashierId.value = id; reload() }
    fun refresh() = reload()

    private fun fromIso(): String? = _range.value.startMillis?.let { "${isoDay(it)}T00:00:00.000Z" }
    private fun toIso(): String? = _range.value.endMillis?.let { "${isoDay(it)}T23:59:59.999Z" }

    private fun reload() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            try {
                val res = repo.list(_cashierId.value, fromIso(), toIso(), page = 1, pageSize = 100)
                _state.value = ShiftsListState(loading = false, items = res.items)
            } catch (e: AppException) {
                _state.value = ShiftsListState(loading = false, error = e.message)
            }
        }
    }

    private fun isoDay(millis: Long): String =
        java.time.Instant.ofEpochMilli(millis).atZone(java.time.ZoneOffset.UTC).toLocalDate().toString()
}
