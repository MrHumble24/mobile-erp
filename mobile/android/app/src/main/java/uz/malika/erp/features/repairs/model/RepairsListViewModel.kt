package uz.malika.erp.features.repairs.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.repairs.data.RepairFilters
import uz.malika.erp.features.repairs.data.RepairListItem
import uz.malika.erp.features.repairs.data.RepairReport
import uz.malika.erp.features.repairs.data.RepairRepository
import uz.malika.erp.shared.ui.DateRange

data class RepairsListState(
    val loading: Boolean = true,
    /** 403 REPAIRS_DISABLED → the setting is off; the screen shows the "turned off" state. */
    val disabled: Boolean = false,
    val error: String? = null,
    val items: List<RepairListItem> = emptyList(),
    val report: RepairReport? = null,
)

/**
 * The repairs list + finance report (ADR 0040): newest first, with a status
 * filter, a date range and a search (ticket / IMEI / customer). Online only.
 * A 403 REPAIRS_DISABLED is surfaced so the screen can show the off state.
 */
class RepairsListViewModel(private val repo: RepairRepository) : ViewModel() {

    private val _status = MutableStateFlow<String?>(null)
    val status = _status.asStateFlow()

    private val _range = MutableStateFlow(DateRange())
    val range = _range.asStateFlow()

    private val _search = MutableStateFlow("")
    val search = _search.asStateFlow()

    private val _state = MutableStateFlow(RepairsListState())
    val state = _state.asStateFlow()

    init { reload() }

    fun setStatus(code: String?) { _status.value = code; reload() }
    fun setRange(range: DateRange) { _range.value = range; reload() }
    fun setSearch(q: String) { _search.value = q; reload() }
    fun refresh() = reload()

    private fun fromIso(): String? = _range.value.startMillis?.let { "${isoDay(it)}T00:00:00.000Z" }
    private fun toIso(): String? = _range.value.endMillis?.let { "${isoDay(it)}T23:59:59.999Z" }

    private fun reload() {
        _state.value = _state.value.copy(loading = true, error = null, disabled = false)
        viewModelScope.launch {
            try {
                val page = repo.list(
                    RepairFilters(
                        status = _status.value,
                        from = fromIso(),
                        to = toIso(),
                        search = _search.value.trim().ifBlank { null },
                        page = 1,
                        pageSize = 100,
                    ),
                )
                val report = runCatching { repo.report(fromIso(), toIso()) }.getOrNull()
                _state.value = RepairsListState(loading = false, items = page.items, report = report)
            } catch (e: AppException) {
                if (e.code == "REPAIRS_DISABLED") {
                    _state.value = RepairsListState(loading = false, disabled = true)
                } else {
                    _state.value = RepairsListState(loading = false, error = e.message)
                }
            }
        }
    }

    private fun isoDay(millis: Long): String =
        java.time.Instant.ofEpochMilli(millis).atZone(java.time.ZoneOffset.UTC).toLocalDate().toString()
}
