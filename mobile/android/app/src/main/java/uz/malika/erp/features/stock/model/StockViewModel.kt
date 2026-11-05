package uz.malika.erp.features.stock.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.stock.data.StockCategory
import uz.malika.erp.features.stock.data.StockLevel
import uz.malika.erp.features.stock.data.StockRepository

data class StockListUi(
    val loading: Boolean = true,
    val items: List<StockLevel> = emptyList(),
    val error: String? = null,
)

/**
 * The Stock screen (ADR 0030): the quantity-product list, filtered server-side by
 * category and a name/barcode/model-code search. The movements sheet and the
 * adjust sheets talk to [repository] directly (paging / one-shot writes) and call
 * [refresh] after a successful adjustment.
 */
class StockViewModel(private val repo: StockRepository) : ViewModel() {

    private val _ui = MutableStateFlow(StockListUi())
    val ui: StateFlow<StockListUi> = _ui.asStateFlow()

    private val _categories = MutableStateFlow<List<StockCategory>>(emptyList())
    val categories: StateFlow<List<StockCategory>> = _categories.asStateFlow()

    private val _search = MutableStateFlow<String?>(null)
    val search: StateFlow<String?> = _search.asStateFlow()

    private val _categoryId = MutableStateFlow<String?>(null)
    val categoryId: StateFlow<String?> = _categoryId.asStateFlow()

    init {
        refresh()
        viewModelScope.launch {
            _categories.value = runCatching { repo.categories() }.getOrDefault(emptyList())
        }
    }

    fun refresh() {
        _ui.value = _ui.value.copy(loading = true, error = null)
        viewModelScope.launch {
            try {
                _ui.value = StockListUi(loading = false, items = repo.list(_categoryId.value, _search.value))
            } catch (e: Exception) {
                _ui.value = StockListUi(loading = false, error = (e as? AppException)?.message ?: "error")
            }
        }
    }

    fun setSearch(query: String?) {
        _search.value = query?.takeIf { it.isNotBlank() }
        refresh()
    }

    fun setCategory(id: String?) {
        _categoryId.value = id
        refresh()
    }

    val repository: StockRepository get() = repo
}
