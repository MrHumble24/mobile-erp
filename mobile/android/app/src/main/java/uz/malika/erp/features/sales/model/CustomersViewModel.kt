package uz.malika.erp.features.sales.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.sales.data.CustomerFilters
import uz.malika.erp.features.sales.data.CustomerListItem
import uz.malika.erp.features.sales.data.CustomerSale
import uz.malika.erp.features.sales.data.CustomerStats
import uz.malika.erp.features.sales.data.CustomersRepository
import uz.malika.erp.shared.lib.PageState

data class CustomerListUi(val state: PageState<CustomerListItem> = PageState(), val error: String? = null)
data class CustomerSalesUi(val loading: Boolean = true, val error: String? = null, val items: List<CustomerSale> = emptyList())
data class CustomerFormUi(val busy: Boolean = false, val error: String? = null, val done: Boolean = false)

/** Customer directory: filtered + paginated list, stats, purchase history, and online-only create/edit. */
class CustomersViewModel(private val repo: CustomersRepository) : ViewModel() {

    private val _list = MutableStateFlow(CustomerListUi())
    val list: StateFlow<CustomerListUi> = _list.asStateFlow()

    private val _filters = MutableStateFlow(CustomerFilters())
    val filters: StateFlow<CustomerFilters> = _filters.asStateFlow()

    private val _stats = MutableStateFlow<CustomerStats?>(null)
    val stats: StateFlow<CustomerStats?> = _stats.asStateFlow()

    private val _sales = MutableStateFlow(CustomerSalesUi())
    val sales: StateFlow<CustomerSalesUi> = _sales.asStateFlow()

    private val _form = MutableStateFlow(CustomerFormUi())
    val form: StateFlow<CustomerFormUi> = _form.asStateFlow()

    init { refresh() }

    fun refresh() {
        _filters.value = _filters.value.copy(page = 1)
        _list.value = _list.value.copy(state = _list.value.state.copy(loading = true), error = null)
        viewModelScope.launch {
            try {
                val page = repo.list(_filters.value)
                _list.value = CustomerListUi(state = PageState<CustomerListItem>().append(page.items, page.total, 1))
            } catch (e: Exception) {
                _list.value = CustomerListUi(error = (e as? AppException)?.message ?: "error")
            }
        }
        viewModelScope.launch { _stats.value = runCatching { repo.stats() }.getOrNull() }
    }

    fun loadMore() {
        val current = _list.value.state
        if (current.loading || !current.hasMore) return
        val next = current.nextPage
        _list.value = _list.value.copy(state = current.copy(loading = true))
        _filters.value = _filters.value.copy(page = next)
        viewModelScope.launch {
            try {
                val page = repo.list(_filters.value)
                _list.value = _list.value.copy(state = _list.value.state.append(page.items, page.total, next))
            } catch (_: Exception) {
                _list.value = _list.value.copy(state = _list.value.state.copy(loading = false))
            }
        }
    }

    fun setSearch(q: String) { _filters.value = _filters.value.copy(search = q); refresh() }
    fun setHasPurchases(v: Boolean?) { _filters.value = _filters.value.copy(hasPurchases = v); refresh() }
    fun setSort(sort: String) { _filters.value = _filters.value.copy(sort = sort); refresh() }
    fun clearFilters() { _filters.value = CustomerFilters(); refresh() }

    fun loadSales(customerId: String) {
        _sales.value = CustomerSalesUi(loading = true)
        viewModelScope.launch {
            try {
                _sales.value = CustomerSalesUi(loading = false, items = repo.sales(customerId))
            } catch (e: Exception) {
                _sales.value = CustomerSalesUi(loading = false, error = (e as? AppException)?.message ?: "error")
            }
        }
    }

    /** Create (id == null) or update a customer. Online-only; blocks offline. */
    fun submit(id: String?, name: String, phone: String?, notes: String?, online: Boolean) {
        if (!online) { _form.value = CustomerFormUi(error = "common.offline"); return }
        _form.value = CustomerFormUi(busy = true)
        viewModelScope.launch {
            try {
                if (id == null) repo.create(name, phone, notes) else repo.update(id, name, phone, notes)
                _form.value = CustomerFormUi(done = true)
                refresh()
            } catch (e: Exception) {
                _form.value = CustomerFormUi(error = (e as? AppException)?.message ?: "common.error")
            }
        }
    }

    fun resetForm() { _form.value = CustomerFormUi() }
}
