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
import uz.malika.erp.features.nasiya.data.NasiyaModule

/**
 * The consignments list for the active tab (Out / Overdue / Settled / Returned
 * / All) plus the summary tiles, both online (`/consignments` is not in the
 * changes feed). Search is debounced; every reload cancels the previous one.
 */
class ConsignmentsViewModel(container: AppContainer) : ViewModel() {

    private val repo = NasiyaModule.consignmentRepository(container)

    private val _tab = MutableStateFlow(ConsignmentTab.OUT)
    val tab = _tab.asStateFlow()

    private val _search = MutableStateFlow("")
    val search = _search.asStateFlow()

    private val _state = MutableStateFlow(ConsignmentsState())
    val state = _state.asStateFlow()

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

    fun refresh() = reload(debounce = false)

    private fun reload(debounce: Boolean) {
        job?.cancel()
        _state.value = _state.value.copy(loading = true, error = null)
        job = viewModelScope.launch {
            if (debounce) delay(300)
            try {
                val items = repo.list(_tab.value, _search.value)
                val stats = repo.stats(_tab.value, _search.value)
                _state.value = ConsignmentsState(loading = false, items = items, stats = stats)
            } catch (e: AppException) {
                _state.value = ConsignmentsState(loading = false, error = e.message)
            }
        }
    }
}
