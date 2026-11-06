package uz.malika.erp.features.orders.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.orders.data.OrderListFilters
import uz.malika.erp.features.orders.data.OrdersRepository
import uz.malika.erp.features.orders.data.StorefrontOrderListItem
import uz.malika.erp.shared.lib.PageState

data class OrdersListUi(
    val state: PageState<StorefrontOrderListItem> = PageState(loading = true),
    val error: String? = null,
    val refreshing: Boolean = false,
)

/**
 * The storefront orders list: newest first (server order), pages of 20 loaded on
 * scroll, filtered by one status chip (null = all). Online only; a failed load
 * surfaces the server message. No caching, no search, no date filter.
 */
class OrdersListViewModel(private val repo: OrdersRepository) : ViewModel() {

    private val _status = MutableStateFlow<String?>(null)
    val status: StateFlow<String?> = _status.asStateFlow()

    private val _ui = MutableStateFlow(OrdersListUi())
    val ui: StateFlow<OrdersListUi> = _ui.asStateFlow()

    init { reload() }

    fun setStatus(code: String?) {
        if (code == _status.value) return
        _status.value = code
        reload()
    }

    fun refresh() {
        _ui.value = _ui.value.copy(refreshing = true)
        reload()
    }

    private fun reload() {
        if (!_ui.value.refreshing) {
            _ui.value = _ui.value.copy(state = _ui.value.state.copy(loading = true), error = null)
        }
        viewModelScope.launch {
            try {
                val page = repo.list(OrderListFilters(status = _status.value, page = 1))
                _ui.value = OrdersListUi(
                    state = PageState<StorefrontOrderListItem>().append(page.items, page.total, 1),
                )
            } catch (e: Exception) {
                _ui.value = OrdersListUi(error = (e as? AppException)?.message ?: "error")
            }
        }
    }

    fun loadMore() {
        val current = _ui.value.state
        if (current.loading || !current.hasMore) return
        val next = current.nextPage
        _ui.value = _ui.value.copy(state = current.copy(loading = true))
        viewModelScope.launch {
            try {
                val page = repo.list(OrderListFilters(status = _status.value, page = next))
                _ui.value = _ui.value.copy(state = _ui.value.state.append(page.items, page.total, next))
            } catch (_: Exception) {
                _ui.value = _ui.value.copy(state = _ui.value.state.copy(loading = false))
            }
        }
    }
}
