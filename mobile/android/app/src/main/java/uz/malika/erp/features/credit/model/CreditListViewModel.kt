package uz.malika.erp.features.credit.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.credit.data.CreditListItem
import uz.malika.erp.features.credit.data.CreditRepository
import uz.malika.erp.features.credit.data.CreditStatus

data class CreditListState(
    val loading: Boolean = true,
    val error: String? = null,
    val items: List<CreditListItem> = emptyList(),
)

/**
 * The customer-credit list for the active status tab (ADR 0035). `/credits` is
 * online only and has no text-search param, so the search box filters the loaded
 * rows by customer name/phone on the client. An optional [customerId] scopes the
 * list to one customer (the customer detail's credits).
 */
class CreditListViewModel(
    private val repo: CreditRepository,
    private val customerId: String? = null,
) : ViewModel() {

    private val _status = MutableStateFlow(CreditStatus.ALL)
    val status = _status.asStateFlow()

    private val _search = MutableStateFlow("")
    val search = _search.asStateFlow()

    private val _state = MutableStateFlow(CreditListState())
    val state = _state.asStateFlow()

    init { reload() }

    fun setStatus(status: CreditStatus) {
        if (status == _status.value) return
        _status.value = status
        reload()
    }

    fun setSearch(value: String) { _search.value = value }

    fun refresh() = reload()

    /** The rows after the client-side customer search filter. */
    fun visible(): List<CreditListItem> {
        val q = _search.value.trim().lowercase()
        if (q.isEmpty()) return _state.value.items
        return _state.value.items.filter {
            it.customer.name.lowercase().contains(q) || (it.customer.phone?.contains(q) == true)
        }
    }

    private fun reload() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            try {
                val items = repo.list(customerId, _status.value)
                _state.value = CreditListState(loading = false, items = items)
            } catch (e: AppException) {
                _state.value = CreditListState(loading = false, error = e.message)
            }
        }
    }
}
