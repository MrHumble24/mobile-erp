package uz.malika.erp.features.nasiya.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AppException
import uz.malika.erp.data.local.PartnerEntity
import uz.malika.erp.features.nasiya.data.NasiyaModule
import uz.malika.erp.features.nasiya.data.toEntity

/** Active-status facet (mirrors the web `ActiveFilter`). */
enum class PartnerActive { ALL, ACTIVE, INACTIVE }

/** Partner directory list: loading / error / rows (as mirror-shaped entities). */
data class PartnersState(
    val loading: Boolean = true,
    val error: String? = null,
    val items: List<PartnerEntity> = emptyList(),
)

/**
 * The partner directory. Online, it reads `/partners` so the `active`/`overdue`
 * facets work (the mirror can't serve them); offline, it falls back to the local
 * mirror filtered by search only — the active/overdue controls are disabled
 * there. Both sources render through the one [PartnerEntity]-shaped card.
 */
class PartnersViewModel(private val container: AppContainer) : ViewModel() {

    private val repo = NasiyaModule.partnerRepository(container)

    data class Filters(
        val search: String = "",
        val active: PartnerActive = PartnerActive.ALL,
        val overdue: Boolean = false,
    )

    private val _filters = MutableStateFlow(Filters())
    val filters: StateFlow<Filters> = _filters.asStateFlow()

    val online: StateFlow<Boolean> = container.connectivity.online

    private val _state = MutableStateFlow(PartnersState())
    val state: StateFlow<PartnersState> = _state.asStateFlow()

    init {
        observe()
    }

    @OptIn(ExperimentalCoroutinesApi::class)
    private fun observe() {
        viewModelScope.launch {
            combine(online, _filters) { on, f -> on to f }.collectLatest { (on, f) ->
                if (on) loadOnline(f) else observeMirror(f)
            }
        }
    }

    private suspend fun loadOnline(f: Filters) {
        _state.value = _state.value.copy(loading = true, error = null)
        delay(300) // debounce typing / rapid facet toggles; collectLatest cancels the prior
        try {
            val rows = repo.list(f.search, f.active.toBool(), f.overdue).map { it.toEntity() }
            _state.value = PartnersState(loading = false, items = rows)
        } catch (e: AppException) {
            _state.value = PartnersState(loading = false, error = e.message)
        }
    }

    /** Offline: reactive mirror, search only (no isActive/overdueCount locally). */
    private suspend fun observeMirror(f: Filters) {
        container.db.partnerDao().watchAll().collectLatest { rows ->
            val q = f.search.trim()
            val filtered = if (q.isEmpty()) {
                rows
            } else {
                rows.filter {
                    it.shopName.contains(q, ignoreCase = true) ||
                        (it.phone?.contains(q, ignoreCase = true) == true)
                }
            }
            _state.value = PartnersState(loading = false, items = filtered)
        }
    }

    fun setSearch(value: String) {
        _filters.value = _filters.value.copy(search = value)
    }

    fun setActive(active: PartnerActive) {
        _filters.value = _filters.value.copy(active = active)
    }

    fun setOverdue(overdue: Boolean) {
        _filters.value = _filters.value.copy(overdue = overdue)
    }

    fun reset() {
        _filters.value = Filters()
    }

    private fun PartnerActive.toBool(): Boolean? = when (this) {
        PartnerActive.ALL -> null
        PartnerActive.ACTIVE -> true
        PartnerActive.INACTIVE -> false
    }
}
