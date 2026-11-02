package uz.malika.erp.features.nasiya.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AppException
import uz.malika.erp.features.nasiya.data.ConsignmentTab
import uz.malika.erp.features.nasiya.data.ConsignmentViewDto
import uz.malika.erp.features.nasiya.data.NasiyaModule
import uz.malika.erp.shared.lib.PageState
import uz.malika.erp.shared.ui.DateRange

/**
 * The consignments list for the active tab (Out / Overdue / Settled / Returned
 * / All) + optional date range, with "load more" pagination and summary tiles,
 * all online (`/consignments` is not in the changes feed). Search is debounced;
 * every reload cancels the previous one. Deep links (from another feature) open
 * one consignment by id via [openById].
 */
class ConsignmentsViewModel(container: AppContainer) : ViewModel() {

    private val repo = NasiyaModule.consignmentRepository(container)

    private val _tab = MutableStateFlow(ConsignmentTab.OUT)
    val tab = _tab.asStateFlow()

    private val _search = MutableStateFlow("")
    val search = _search.asStateFlow()

    private val _range = MutableStateFlow(DateRange())
    val range = _range.asStateFlow()

    private val _state = MutableStateFlow(ConsignmentsState())
    val state = _state.asStateFlow()

    private val _deepLinked = MutableStateFlow<ConsignmentViewDto?>(null)
    val deepLinked = _deepLinked.asStateFlow()

    /** Consignment mutations parked in the outbox (offline), for a pending marker. */
    val pendingCount: StateFlow<Int> =
        container.db.outboxDao().watchAll()
            .map { rows -> rows.count { it.type.startsWith("consignment.") } }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), 0)

    private var job: Job? = null

    init {
        reload(debounce = false)
    }

    fun setTab(tab: ConsignmentTab) {
        if (tab == _tab.value) return
        _tab.value = tab
        reload(debounce = false)
    }

    fun setSearch(value: String) {
        _search.value = value
        reload(debounce = true)
    }

    fun setRange(range: DateRange) {
        _range.value = range
        reload(debounce = false)
    }

    fun refresh() = reload(debounce = false)

    /** Open one consignment by id (cross-feature deep link); fetched fresh. */
    fun openById(id: String) {
        viewModelScope.launch {
            runCatching { repo.get(id) }.getOrNull()?.let { _deepLinked.value = it }
        }
    }

    fun clearDeepLink() {
        _deepLinked.value = null
    }

    fun loadMore() {
        val current = _state.value.page
        if (_state.value.loading || current.loading || !current.hasMore) return
        _state.value = _state.value.copy(page = current.copy(loading = true))
        viewModelScope.launch {
            val next = current.nextPage
            try {
                val dto = repo.page(_tab.value, _search.value, fromIso(), toIso(), page = next)
                _state.value = _state.value.copy(page = current.append(dto.items, dto.total, next))
            } catch (_: AppException) {
                _state.value = _state.value.copy(page = current.copy(loading = false))
            }
        }
    }

    private fun fromIso(): String? = _range.value.startMillis?.let { "${isoDayUtc(it)}T00:00:00.000Z" }
    private fun toIso(): String? = _range.value.endMillis?.let { "${isoDayUtc(it)}T23:59:59.999Z" }

    private fun reload(debounce: Boolean) {
        job?.cancel()
        _state.value = _state.value.copy(loading = true, error = null, page = PageState())
        job = viewModelScope.launch {
            if (debounce) delay(300)
            try {
                val dto = repo.page(_tab.value, _search.value, fromIso(), toIso(), page = 1)
                val stats = repo.stats(_tab.value, _search.value, fromIso(), toIso())
                _state.value = ConsignmentsState(
                    loading = false,
                    page = PageState<ConsignmentViewDto>().append(dto.items, dto.total, 1),
                    stats = stats,
                )
            } catch (e: AppException) {
                _state.value = ConsignmentsState(loading = false, error = e.message)
            }
        }
    }
}
