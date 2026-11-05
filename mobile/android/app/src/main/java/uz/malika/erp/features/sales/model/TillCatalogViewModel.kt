package uz.malika.erp.features.sales.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.features.sales.data.CatalogCard
import uz.malika.erp.features.sales.data.CatalogCategoryDto
import uz.malika.erp.features.sales.data.CatalogUnitItem
import uz.malika.erp.features.sales.data.TillCatalogRepository

data class CatalogBrowseState(
    val cards: List<CatalogCard> = emptyList(),
    val categories: List<CatalogCategoryDto> = emptyList(),
    val categoryId: String? = null,
    val query: String = "",
    val loading: Boolean = false,
    val errorKey: String? = null,
)

/**
 * Drives the till's Catalog mode (ADR 0031): the product grid for the current
 * search + category, and the category chips. Typing debounces the reload; the
 * repository picks the online `/catalog` read or the offline Room grid. Tapping
 * a card loads that product's units through [unitsFor]; the cart itself lives in
 * [PosViewModel], so both modes feed one cart.
 */
class TillCatalogViewModel(private val repo: TillCatalogRepository) : ViewModel() {

    private val _state = MutableStateFlow(CatalogBrowseState())
    val state: StateFlow<CatalogBrowseState> = _state.asStateFlow()

    private var loadJob: Job? = null
    private var started = false

    fun start(online: Boolean) {
        if (started) return
        started = true
        loadCategories(online)
        reload(online)
    }

    fun setCategory(id: String?, online: Boolean) {
        _state.value = _state.value.copy(categoryId = id)
        reload(online)
    }

    fun setQuery(q: String, online: Boolean) {
        _state.value = _state.value.copy(query = q)
        reload(online, debounce = true)
    }

    fun reload(online: Boolean, debounce: Boolean = false) {
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            if (debounce) delay(300)
            val s = _state.value
            _state.value = s.copy(loading = true, errorKey = null)
            _state.value = try {
                val cards = repo.cards(s.categoryId, s.query, online)
                _state.value.copy(cards = cards, loading = false)
            } catch (_: Exception) {
                _state.value.copy(loading = false, errorKey = "common.error")
            }
        }
    }

    private fun loadCategories(online: Boolean) {
        viewModelScope.launch {
            runCatching { repo.categories(online) }.getOrNull()?.let {
                _state.value = _state.value.copy(categories = it)
            }
        }
    }

    suspend fun unitsFor(modelId: String, online: Boolean): List<CatalogUnitItem> =
        repo.units(modelId, online)
}
