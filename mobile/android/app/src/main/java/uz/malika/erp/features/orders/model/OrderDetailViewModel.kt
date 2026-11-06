package uz.malika.erp.features.orders.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.orders.data.OrdersRepository
import uz.malika.erp.features.orders.data.StorefrontOrderDetail

data class OrderDetailState(
    val loading: Boolean = true,
    val busy: Boolean = false,
    val error: String? = null,
    /** 404: the order moved to another store or was removed — the screen closes. */
    val notFound: Boolean = false,
    val order: StorefrontOrderDetail? = null,
)

/**
 * One storefront order: loads it with its history, then runs a status change
 * (contacted / done / cancelled). The server owns the transition rules, so a
 * refusal (`INVALID_STATUS_TRANSITION`, `ORDER_TERMINAL`) shows its message and
 * leaves the order unchanged; a 404 asks the screen to close. Online only.
 */
class OrderDetailViewModel(
    private val repo: OrdersRepository,
    private val id: String,
) : ViewModel() {

    private val _state = MutableStateFlow(OrderDetailState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            try {
                _state.value = OrderDetailState(loading = false, order = repo.get(id))
            } catch (e: AppException) {
                _state.value = OrderDetailState(loading = false, notFound = e.statusCode == 404, error = e.message)
            }
        }
    }

    fun changeStatus(toStatusCode: String, onDone: () -> Unit = {}) {
        if (_state.value.busy) return
        _state.value = _state.value.copy(busy = true, error = null)
        viewModelScope.launch {
            try {
                val updated = repo.updateStatus(id, toStatusCode)
                _state.value = _state.value.copy(busy = false, order = updated)
                onDone()
            } catch (e: AppException) {
                _state.value = _state.value.copy(busy = false, notFound = e.statusCode == 404, error = e.message)
            }
        }
    }
}
