package uz.malika.erp.features.repairs.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.repairs.data.RepairRepository
import uz.malika.erp.features.repairs.data.RepairView

data class RepairDetailState(
    val loading: Boolean = true,
    val busy: Boolean = false,
    val error: String? = null,
    val repair: RepairView? = null,
)

/**
 * One repair ticket (ADR 0040): loads it, then runs the money/parts/status
 * actions, each of which returns the full updated ticket. A failed action shows
 * its server message (clear for `REPAIR_ILLEGAL_MOVE`, `REPAIR_BALANCE_OWED`,
 * `NO_OPEN_SHIFT`, …) and leaves the ticket unchanged. Online only.
 */
class RepairDetailViewModel(
    private val repo: RepairRepository,
    private val id: String,
) : ViewModel() {

    private val _state = MutableStateFlow(RepairDetailState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            try {
                _state.value = RepairDetailState(loading = false, repair = repo.get(id))
            } catch (e: AppException) {
                _state.value = RepairDetailState(loading = false, error = e.message)
            }
        }
    }

    fun clearError() { _state.value = _state.value.copy(error = null) }

    fun changeStatus(toStatusCode: String, note: String?, onDone: () -> Unit = {}) =
        act(onDone) { repo.changeStatus(id, toStatusCode, note) }

    fun addPart(modelId: String, quantity: Int, onDone: () -> Unit = {}) =
        act(onDone) { repo.addPart(id, modelId, quantity) }

    fun removePart(partId: String) = act { repo.removePart(id, partId) }

    fun addPayment(amount: Double, accountCode: String, onDone: () -> Unit = {}) =
        act(onDone) { repo.addPayment(id, amount, accountCode) }

    fun refund(amount: Double, accountCode: String, onDone: () -> Unit = {}) =
        act(onDone) { repo.refund(id, amount, accountCode) }

    fun outsidePayment(amount: Double, accountCode: String, onDone: () -> Unit = {}) =
        act(onDone) { repo.outsidePayment(id, amount, accountCode) }

    /** Run one action, swap in the returned ticket, and signal the caller on success. */
    private fun act(onDone: () -> Unit = {}, block: suspend () -> RepairView) {
        if (_state.value.busy) return
        _state.value = _state.value.copy(busy = true, error = null)
        viewModelScope.launch {
            try {
                val updated = block()
                _state.value = _state.value.copy(busy = false, repair = updated)
                onDone()
            } catch (e: AppException) {
                _state.value = _state.value.copy(busy = false, error = e.message)
            }
        }
    }
}
