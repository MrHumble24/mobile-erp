package uz.malika.erp.features.nasiya.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import uz.malika.erp.AppContainer
import uz.malika.erp.data.local.PartnerEntity

/**
 * The partner directory, offline-first from the local mirror (hydrated by
 * `/sync/changes`). Search filters shopName/phone in memory — the only facet
 * the mirror carries. `active`/`overdue` facets and open/overdue counts need
 * fields the mirror does not mirror (see README / task notes).
 */
class PartnersViewModel(container: AppContainer) : ViewModel() {

    private val _search = MutableStateFlow("")
    val search: StateFlow<String> = _search.asStateFlow()

    val online: StateFlow<Boolean> = container.connectivity.online

    val partners: StateFlow<List<PartnerEntity>> =
        combine(container.db.partnerDao().watchAll(), _search) { rows, q ->
            val needle = q.trim()
            if (needle.isEmpty()) {
                rows
            } else {
                rows.filter {
                    it.shopName.contains(needle, ignoreCase = true) ||
                        (it.phone?.contains(needle, ignoreCase = true) == true)
                }
            }
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun setSearch(value: String) {
        _search.value = value
    }
}
